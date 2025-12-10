const { pool } = require('../db');

/**
 * GET /api/state-vs-national-trend-weekly
 * Returns weekly per-capita rates for just a specific state for a given disease and year.
 * Input: stateName, diseaseName, year
 * Output: [{ week, stateCasesPer100k }]
 */
const getStateVsNationalTrendWeekly = async (req, res) => {
    try {
      const { stateName, diseaseName } = req.query;
      if (!stateName || !diseaseName) {
        return res.status(400).json({ error: 'stateName and diseaseName required' });
      }
      console.log('[DEBUG] stateName:', stateName, '| diseaseName:', diseaseName);
      const sql = `
          SELECT
              f.year,
              f.week,
              r.state_name,
              d.disease_name,
              SUM(COALESCE(f.current_week_cases, 0)) AS total_cases
          FROM fact_cases_weekly f
          JOIN dim_region r ON f.region_id = r.region_id
          JOIN dim_disease d ON f.disease_id = d.disease_id
          WHERE
              r.state_name = $1
              AND d.disease_name = $2 
          GROUP BY
              f.year,
              f.week,
              r.state_name,
              d.disease_name
          ORDER BY
              f.year, f.week;
      `;
      const result = await pool.query(sql, [stateName, diseaseName]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/state-vs-national-trend-weekly:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getStateVsNationalTrendWeekly;