const { pool } = require('../db');

/**
 * GET /api/estimated-demographic-cases
 * 
 * Estimates the number of cases for a specific demographic group in a state/year/disease
 * by proportionally distributing total cases based on population share.
 * Uses the 3NF normalized NNDSS tables (fact_nndss_weekly) for case data.
 * 
 * Calculation: estimatedCases = (demo_population / total_state_demo_population) * total_yearly_cases
 * 
 * @param {string} stateName - Full state name (required)
 * @param {string} diseaseName - Disease name (required)
 * @param {number} year - Year to analyze (required)
 * @param {string} race - Race/ethnicity category (required)
 * @param {string} sex - Sex category (required)
 * @param {string} ageGroup - Age group category (required)
 * 
 * @returns {Object} Estimated case statistics:
 *   - stateName, diseaseName, year, popYear, race, sex, ageGroup
 *   - population: Demographic group population
 *   - totalYearlyCases: Total cases for state/disease/year
 *   - estimatedDemographicCases: Estimated cases for the demographic group
 *   - casesPer100k: Estimated cases per 100,000 population
 * 
 * @example
 * GET /api/estimated-demographic-cases?stateName=California&diseaseName=COVID-19&year=2023&race=White&sex=Male&ageGroup=18-64
 */
const getEstimatedDemographicCases = async (req, res) => {
    try {
      const { stateName, diseaseName, year, race, sex, ageGroup } = req.query;
  
      if (!stateName || !diseaseName || !year || !race || !sex || !ageGroup) {
        return res.status(400).json({ error: 'Missing required query params.' });
      }
  
      const caseYear = Number(year);
      if (Number.isNaN(caseYear)) {
        return res.status(400).json({ error: 'Year must be a number' });
      }
  
      // Population only up to 2023
      const popYear = caseYear === 2024 ? 2023 : caseYear;
  
      const sql = `
        WITH demo_pop AS (
          -- Population for the specific demographic cell in the state / popYear
          SELECT
            p.population::FLOAT AS population,
            r.region_id
          FROM fact_population_state_demo_year p
          JOIN dim_region r
            ON p.region_id = r.region_id
          WHERE r.state_name = $1               -- stateName
            AND p.year       = $2               -- popYear
            AND p.race       = $4
            AND p.sex        = $5
            AND p.age_group  = $6
        ),
        state_pop AS (
          -- Total state population in that popYear (sum over all demos)
          SELECT
            SUM(p.population)::FLOAT AS total_state_population
          FROM fact_population_state_demo_year p
          JOIN dim_region r
            ON p.region_id = r.region_id
          WHERE r.state_name = $1
            AND p.year       = $2
        ),
        state_cases AS (
          -- Total yearly cases for the state/disease/caseYear from NNDSS (3NF)
          SELECT
            COALESCE(SUM(f.current_week), 0)::FLOAT AS total_yearly_cases
          FROM fact_nndss_weekly f
          JOIN dim_region_ndss r_ndss
            ON f.region_id = r_ndss.region_id
          JOIN dim_region r
            ON UPPER(r_ndss.reporting_area) = UPPER(r.state_name)
          JOIN dim_disease d
            ON f.disease_id = d.disease_id
          WHERE r.state_name        = $1       -- stateName, via dim_region
            AND d.disease_name      = $3       -- diseaseName
            AND f.current_mmwr_year = $7       -- caseYear
        )
        SELECT
          dp.population,
          dp.region_id,
          sp.total_state_population,
          sc.total_yearly_cases,
          CASE
            WHEN sp.total_state_population > 0
            THEN (dp.population / sp.total_state_population) * sc.total_yearly_cases
            ELSE 0
          END AS estimated_demographic_cases,
          CASE
            WHEN dp.population > 0 AND sp.total_state_population > 0
            THEN ((dp.population / sp.total_state_population)
                  * sc.total_yearly_cases
                  / dp.population) * 100000
            ELSE 0
          END AS cases_per_100k
        FROM demo_pop  dp
        CROSS JOIN state_pop   sp
        CROSS JOIN state_cases sc;
      `;
  
      // $1 = stateName
      // $2 = popYear
      // $3 = diseaseName
      // $4 = race
      // $5 = sex
      // $6 = ageGroup
      // $7 = caseYear
      const result = await pool.query(sql, [
        stateName,
        popYear,
        diseaseName,
        race,
        sex,
        ageGroup,
        caseYear,
      ]);
  
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'No matching demographic population found.' });
      }
  
      const row = result.rows[0];
  
      const population = Number(row.population) || 0;
      const totalYearlyCases = Number(row.total_yearly_cases) || 0;
      const estimatedDemographicCases =
        Number(row.estimated_demographic_cases) || 0;
      const casesPer100k = Number(row.cases_per_100k) || 0;
  
      res.json({
        stateName,
        diseaseName,
        year: caseYear,  // user-requested year
        popYear,
        race,
        sex,
        ageGroup,
        population,
        totalYearlyCases,
        estimatedDemographicCases,
        casesPer100k: Number(casesPer100k.toFixed(2)),
      });
    } catch (err) {
      console.error('Error in /api/estimated-demographic-cases:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getEstimatedDemographicCases;