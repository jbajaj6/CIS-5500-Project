const { pool } = require('../db');

/**
 * GET /api/top-states-by-disease
 * 
 * Identifies the top disease (by per-capita rate) for each state in a given year.
 * Returns one disease per state - the one with the highest cases per 100,000.
 * 
 * @param {number} [year=2025] - Year to analyze (defaults to 2025)
 * 
 * @returns {Array<Object>} Array of top disease objects per state:
 *   - stateName: Name of the state
 *   - diseaseName: Top disease for that state
 *   - totalCases: Total cases for the disease
 *   - totalPopulation: State population
 *   - casesPer100k: Cases per 100,000 population
 * 
 * @example
 * GET /api/top-states-by-disease?year=2023
 */
const getTopStatesByDisease = async (req, res) => {
    try {
      const year = parseInt(req.query.year, 10) || 2025;
      
      const sql = `
        WITH state_disease_rates AS (
          SELECT 
            r.state_name AS "stateName",
            d.disease_name AS "diseaseName",
            SUM(f.current_week_cases) AS "totalCases",
            p.population AS "totalPopulation",
            (SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population, 0)) * 100000 AS "casesPer100k",
            ROW_NUMBER() OVER (
              PARTITION BY r.state_name 
              ORDER BY (SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population, 0)) * 100000 DESC NULLS LAST
            ) AS rank
          FROM fact_cases_weekly f
          JOIN dim_region r ON f.region_id = r.region_id
          JOIN dim_disease d ON f.disease_id = d.disease_id
          JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = LEAST($1, 2023)
          WHERE f.year = $1
          GROUP BY r.state_name, d.disease_name, p.population
        )
        SELECT 
          "stateName", 
          "diseaseName", 
          "totalCases", 
          "totalPopulation", 
          "casesPer100k"
        FROM state_disease_rates
        WHERE rank = 1
        ORDER BY "stateName" ASC;`;
      
      const result = await pool.query(sql, [year]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/top-states-by-disease:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  module.exports = getTopStatesByDisease;