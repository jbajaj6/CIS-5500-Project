const { pool } = require('../db');

/**
 * GET /api/state-weekly-percapita
 * 
 * Calculates weekly per-capita rates and 52-week maximum rates for specified diseases.
 * Useful for comparing current week rates against recent historical peaks.
 * 
 * @param {number} year - Year of the week to analyze (required)
 * @param {number} week - Week number (1-52) to analyze (required)
 * @param {string} diseaseIds - Comma-separated list of disease IDs (required)
 * 
 * @returns {Array<Object>} Array of weekly rate objects:
 *   - state_name: Name of the state
 *   - disease_name: Name of the disease
 *   - perCapitaWeeklyCases: Cases per 100,000 for the specified week
 *   - perCapita52WeekMax: Maximum cases per 100,000 in the past 52 weeks
 * 
 * @example
 * GET /api/state-weekly-percapita?year=2023&week=25&diseaseIds=1,2,3
 */
const getStateWeeklyPercapita = async (req, res) => {
    try {
      const year = parseInt(req.query.year, 10);
      const week = parseInt(req.query.week, 10);
      const diseaseIds = req.query.diseaseIds
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(x => !isNaN(x));
      if (Number.isNaN(year) || Number.isNaN(week) || diseaseIds.length === 0) {
        return res.status(400).json({ error: 'year, week, and diseaseIds[] are required' });
      }
      const sql = `
        WITH percap_state_week AS (
          SELECT
            r.state_name,
            d.disease_name,
            f.disease_id,
            f.region_id,
            SUM(COALESCE(f.current_week_cases, 0)) AS weekly_cases
          FROM fact_cases_weekly f
          JOIN dim_region r ON f.region_id = r.region_id
          JOIN dim_disease d ON f.disease_id = d.disease_id
          WHERE f.year = $1 AND f.week = $2 AND f.disease_id = ANY($3::int[])
          GROUP BY r.state_name, d.disease_name, f.disease_id, f.region_id
        ), percap_state_52wkmax AS (
          SELECT
            f.region_id,
            f.disease_id,
            MAX(SUM(COALESCE(f.current_week_cases, 0))) OVER (PARTITION BY f.region_id, f.disease_id) AS max_52w_cases
          FROM fact_cases_weekly f
          WHERE f.year = $1 AND f.week BETWEEN GREATEST($2-51,1) AND $2 AND f.disease_id = ANY($3::int[])
          GROUP BY f.region_id, f.disease_id, f.week
        )
        SELECT DISTINCT
          psw.state_name,
          psw.disease_name,
          (psw.weekly_cases::NUMERIC / NULLIF(p.population,0)) * 100000 AS "perCapitaWeeklyCases",
          (ps52.max_52w_cases::NUMERIC / NULLIF(p.population,0)) * 100000 AS "perCapita52WeekMax"
        FROM percap_state_week psw
        JOIN percap_state_52wkmax ps52
          ON psw.region_id = ps52.region_id AND psw.disease_id = ps52.disease_id
        JOIN fact_population_state_year p
          ON p.region_id = psw.region_id AND p.year = LEAST($1, 2023)
        ORDER BY psw.state_name, psw.disease_name;
      `;
      const result = await pool.query(sql, [year, week, diseaseIds]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/state-weekly-percapita:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  module.exports = getStateWeeklyPercapita;