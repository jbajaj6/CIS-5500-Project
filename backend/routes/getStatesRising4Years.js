const { pool } = require('../db');

/**
 * GET /api/states-rising-4years
 * 
 * Identifies states with monotonically increasing per-capita disease rates
 * over a 4-year period using SQL window functions for efficient computation.
 * Useful for detecting emerging disease trends.
 * 
 * @param {string} diseaseName - Disease name to analyze (required)
 * @param {number} startYear - First year of the 4-year window (required)
 * @param {number} endYear - Last year of the 4-year window (must be startYear + 3) (required)
 * 
 * @returns {Array<Object>} Array of states with rising trends:
 *   - stateName: Name of the state with increasing rates
 * 
 * @example
 * GET /api/states-rising-4years?diseaseName=COVID-19&startYear=2020&endYear=2023
 */
const getStatesRising4Years = async (req, res) => {
    try {
      const { diseaseName, startYear, endYear } = req.query;
      const y0 = parseInt(startYear, 10);
      const y3 = parseInt(endYear, 10);
  
      if (!diseaseName || isNaN(y0) || isNaN(y3) || y3 - y0 !== 3) {
        return res.status(400).json({ error: 'Provide diseaseName, startYear, endYear (4-year window)' });
      }
  
      const sql = `
        WITH per_year AS (
          SELECT
            r.state_name,
            f.year,
            SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population, 0) * 100000 AS rate
          FROM fact_cases_weekly f
          JOIN dim_disease d ON f.disease_id = d.disease_id
          JOIN dim_region r ON f.region_id = r.region_id
          JOIN fact_population_state_year p
            ON p.region_id = r.region_id
           AND p.year = LEAST(f.year, 2023)
          WHERE f.year BETWEEN $1 AND $2
            AND d.disease_name = $3
          GROUP BY r.state_name, f.year, p.population
        ),
        with_lag AS (
          SELECT
            state_name,
            year,
            rate,
            LAG(rate) OVER (PARTITION BY state_name ORDER BY year) AS prev_rate
          FROM per_year
        )
        SELECT
          state_name AS "stateName"
        FROM with_lag
        GROUP BY state_name
        HAVING
          COUNT(*) = ($2 - $1 + 1)
          AND BOOL_AND(prev_rate IS NULL OR rate > prev_rate)
        ORDER BY state_name;
      `;
  
      const q = await pool.query(sql, [y0, y3, diseaseName]);
      res.json(q.rows);
    } catch (err) {
      console.error('Error in /api/states-rising-4years:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getStatesRising4Years;