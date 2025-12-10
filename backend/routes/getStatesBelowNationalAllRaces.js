const { pool } = require('../db');

/**
 * GET /api/states-below-national-all-races
 * 
 * Identifies states where ALL racial groups have per-capita death rates below
 * their respective national averages. Uses fact_deaths table for death statistics.
 * These are considered "low-risk" states.
 * 
 * @param {string} diseaseName - Disease name to analyze (required)
 * @param {number} year - Year to analyze (required)
 * 
 * @returns {Array<Object>} Array of low-risk states:
 *   - stateName: Name of the state
 * 
 * @example
 * GET /api/states-below-national-all-races?diseaseName=COVID-19&year=2023
 */
const getStatesBelowNationalAllRaces = async (req, res) => {
    try {
      const { diseaseName, year } = req.query;
      const yr = parseInt(year, 10);
  
      if (!diseaseName || isNaN(yr)) {
        return res.status(400).json({ error: 'diseaseName and year required' });
      }
  
      const sql = `
        -- 1) National per-capita death rates by demographic cell (race/sex/age_group)
        WITH national_race_rates AS (
      -- 1) National per-capita death rate by race
      SELECT
        fd.race,
        SUM(fd.deaths)::NUMERIC
          / NULLIF(SUM(pop.population), 0) AS natl_rate
      FROM fact_deaths fd
      JOIN fact_population_state_demo_year pop
        ON fd.year      = pop.year
      AND fd.race      = pop.race
      AND fd.sex       = pop.sex
      AND fd.age_group = pop.age_group
      WHERE fd.disease_name = $1
        AND fd.year         = $2
      GROUP BY fd.race
    ),
  
    state_race_rates AS (
      -- 2) State per-capita death rate by race
      SELECT
        r.state_name,
        fd.race,
        SUM(fd.deaths)::NUMERIC
          / NULLIF(SUM(pop.population), 0) AS state_rate
      FROM fact_deaths fd
      JOIN fact_population_state_demo_year pop
        ON fd.year      = pop.year
      AND fd.race      = pop.race
      AND fd.sex       = pop.sex
      AND fd.age_group = pop.age_group
      AND fd.region_id = pop.region_id        -- adjust if your key is different
      JOIN dim_region r
        ON pop.region_id = r.region_id
      WHERE fd.disease_name = $1
        AND fd.year         = $2
      GROUP BY r.state_name, fd.race
    ),
  
    state_vs_national AS (
      -- 3) Compare each state's race-specific rate with the national race-specific rate
      SELECT
        s.state_name,
        s.race,
        s.state_rate,
        n.natl_rate,
        CASE
          WHEN s.state_rate < n.natl_rate THEN 1 ELSE 0
        END AS is_below_nat
      FROM state_race_rates s
      JOIN national_race_rates n
        ON s.race = n.race
    )
  
    -- 4) Keep only states that are below the national rate for EVERY race
    SELECT
      state_name AS "stateName"
    FROM state_vs_national
    GROUP BY state_name
    HAVING MIN(is_below_nat) = 1      -- no race where state_rate >= natl_rate
    ORDER BY state_name;
  
      `;
  
      const result = await pool.query(sql, [diseaseName, yr]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/states-below-national-all-races:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

  module.exports = getStatesBelowNationalAllRaces;