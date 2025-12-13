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
  
      // Population data only up to 2023
      const popYear = caseYear === 2024 ? 2023 : caseYear;
  
      const sql = `
        WITH state_cases AS (
            SELECT
                r.state_name,
                SUM(f.current_week)::NUMERIC AS state_cases
            FROM fact_nndss_weekly f
            JOIN dim_region_ndss r_ndss
                ON f.region_id = r_ndss.region_id
            JOIN dim_region r
                ON UPPER(r_ndss.reporting_area) = UPPER(r.state_name)
            JOIN dim_disease d
                ON f.disease_id = d.disease_id
            WHERE d.disease_name      = $1
                AND f.current_mmwr_year = $2
            GROUP BY r.state_name
            ),

            demo_pop AS (
            SELECT
                r.state_name,
                p.race,
                p.sex,
                p.age_group,
                p.population::NUMERIC AS demo_population
            FROM fact_population_state_demo_year p
            JOIN dim_region r
                ON p.region_id = r.region_id
            WHERE p.year = $3
            ),

            state_tot_pop AS (
            SELECT
                state_name,
                SUM(demo_population) AS state_population
            FROM demo_pop
            GROUP BY state_name
            ),

            demo_shares AS (
            SELECT
                dp.state_name,
                dp.race,
                dp.sex,
                dp.age_group,
                dp.demo_population,
                sp.state_population,
                CASE
                WHEN sp.state_population > 0
                THEN dp.demo_population / sp.state_population
                ELSE 0
                END AS demo_pop_share
            FROM demo_pop dp
            JOIN state_tot_pop sp
                ON dp.state_name = sp.state_name
            ),

            demo_expected_cases AS (
            SELECT
                ds.race,
                ds.sex,
                ds.age_group,
                SUM(ds.demo_pop_share * COALESCE(sc.state_cases, 0)) AS demo_cases
            FROM demo_shares ds
            LEFT JOIN state_cases sc
                ON ds.state_name = sc.state_name
            GROUP BY ds.race, ds.sex, ds.age_group
            ),

            total_cases AS (
            SELECT COALESCE(SUM(state_cases), 0) AS total_cases
            FROM state_cases
            ),

            national_demo_pop AS (
            SELECT
                p.race,
                p.sex,
                p.age_group,
                SUM(p.population)::NUMERIC AS demo_population
            FROM fact_population_state_demo_year p
            WHERE p.year = $3                -- popYear
            GROUP BY p.race, p.sex, p.age_group
            ),

            national_tot_pop AS (
            SELECT COALESCE(SUM(demo_population), 0) AS total_population
            FROM national_demo_pop
            )

            SELECT
            dec.race,
            dec.sex,
            dec.age_group,
            dec.demo_cases,
            ndp.demo_population AS demo_population,
            CASE
                WHEN tc.total_cases > 0
                THEN dec.demo_cases / tc.total_cases
                ELSE 0
            END AS share_of_cases,
            CASE
                WHEN ntp.total_population > 0
                THEN ndp.demo_population / ntp.total_population
                ELSE 0
            END AS share_of_population,
            CASE
                WHEN tc.total_cases > 0 AND ntp.total_population > 0
                THEN (dec.demo_cases / tc.total_cases)
                    - (ndp.demo_population / ntp.total_population)
                ELSE 0
            END AS over_under_exposure
            FROM demo_expected_cases dec
            JOIN total_cases tc ON TRUE
            JOIN national_demo_pop ndp
            ON ndp.race = dec.race
            AND ndp.sex  = dec.sex
            AND ndp.age_group = dec.age_group
            JOIN national_tot_pop ntp ON TRUE
            ORDER BY dec.race, dec.sex, dec.age_group;

      `;
  
 
      const q = await pool.query(sql, [diseaseName, caseYear, popYear]);
  
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