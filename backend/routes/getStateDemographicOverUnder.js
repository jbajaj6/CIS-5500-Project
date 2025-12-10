const { pool } = require('../db');

/**
 * GET /api/state-demographic-overunder
 * 
 * Analyzes demographic exposure disparities by comparing each demographic group's
 * share of cases vs. share of population. Uses 3NF normalized NNDSS tables for case data.
 * Positive values indicate over-exposure, negative values indicate under-exposure.
 * 
 * @param {string} stateName - Full state name (required)
 * @param {string} diseaseName - Disease name (required)
 * @param {number} year - Year to analyze (required)
 * 
 * @returns {Array<Object>} Array of demographic group analyses:
 *   - race, sex, ageGroup: Demographic identifiers
 *   - demoCases: Estimated cases for this demographic group (proportional allocation)
 *   - demoPopulation: Population for this demographic group
 *   - shareOfCases: Percentage of total cases
 *   - shareOfPopulation: Percentage of total population
 *   - overUnderExposure: Difference (shareOfCases - shareOfPopulation)
 * 
 * @example
 * GET /api/state-demographic-overunder?stateName=California&diseaseName=COVID-19&year=2023
 */
const getStateDemographicOverUnder = async (req, res) => {
    try {
      const { stateName, diseaseName, year } = req.query;
  
      if (!stateName || !diseaseName || !year) {
        return res
          .status(400)
          .json({ error: "Missing required query params" });
      }
  
      const caseYear = parseInt(year, 10);
      if (Number.isNaN(caseYear)) {
        return res
          .status(400)
          .json({ error: "Year must be a number" });
      }
  
      // Population data only up to 2023 → fall back
      const popYear = caseYear === 2024 ? 2023 : caseYear;
  
      const sql = `
        -- 1) Total cases in this state/year/disease from NDSS (3NF tables)
        WITH cases_total AS (
          SELECT
            COALESCE(SUM(f.current_week), 0)::NUMERIC AS total_cases
          FROM fact_nndss_weekly f
          JOIN dim_region_ndss r_ndss
            ON f.region_id = r_ndss.region_id
          JOIN dim_region r
            ON UPPER(r_ndss.reporting_area) = UPPER(r.state_name)
          JOIN dim_disease d
            ON f.disease_id = d.disease_id
          WHERE r.state_name        = $1      -- stateName
            AND d.disease_name      = $2      -- diseaseName
            AND f.current_mmwr_year = $3      -- caseYear
        ),
  
        -- 2) Demographic population breakdown for that state/popYear
        demo_pop AS (
          SELECT
            pop.race,
            pop.sex,
            pop.age_group,
            pop.population::NUMERIC AS demo_population
          FROM fact_population_state_demo_year pop
          JOIN dim_region r
            ON pop.region_id = r.region_id
          WHERE r.state_name = $1
            AND pop.year     = $4             -- popYear
        ),
  
        -- 3) Total population for normalizing shares
        tot_pop AS (
          SELECT COALESCE(SUM(demo_population), 0) AS total_population
          FROM demo_pop
        )
  
        -- 4) Allocate total cases to each demographic by population share
        SELECT
          dp.race,
          dp.sex,
          dp.age_group,
          CASE
            WHEN tp.total_population > 0
            THEN dp.demo_population * ct.total_cases / tp.total_population
            ELSE 0
          END AS demo_cases,
          dp.demo_population
        FROM demo_pop dp
        CROSS JOIN tot_pop   tp
        CROSS JOIN cases_total ct;
      `;
  
      // $1 = stateName
      // $2 = diseaseName
      // $3 = caseYear
      // $4 = popYear
      const q = await pool.query(sql, [stateName, diseaseName, caseYear, popYear]);
  
      // Even if there are no NDSS rows, demo_pop might still have rows;
      // in that case total_cases = 0, so everything becomes 0 but rows still exist.
      const rows = q.rows || [];
  
      const totalCases = rows.reduce(
        (sum, r) => sum + Number(r.demo_cases || 0),
        0
      );
      const totalPop = rows.reduce(
        (sum, r) => sum + Number(r.demo_population || 0),
        0
      );
  
      const response = rows.map((row) => {
        const demoCases = Number(row.demo_cases || 0);
        const pop = Number(row.demo_population || 0);
  
        const shareCases = totalCases ? demoCases / totalCases : 0;
        const sharePop = totalPop ? pop / totalPop : 0;
  
        return {
          race: row.race,
          sex: row.sex,
          ageGroup: row.age_group,
          demoCases,
          demoPopulation: pop,
          shareOfCases: Number(shareCases.toFixed(4)),
          shareOfPopulation: Number(sharePop.toFixed(4)),
          overUnderExposure: Number((shareCases - sharePop).toFixed(4)),
        };
      });
  
      res.json(response);
    } catch (err) {
      console.error("Error in /api/state-demographic-overunder:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  module.exports = getStateDemographicOverUnder;