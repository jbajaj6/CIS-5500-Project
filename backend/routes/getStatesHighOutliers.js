const { pool } = require('../db');

/**
 * GET /api/states-high-outliers
 * 
 * Identifies states with per-capita disease rates above the statistical threshold
 * (mean + standard deviation) for a given disease and year.
 * Useful for identifying states requiring immediate attention.
 * 
 * @param {string} diseaseName - Disease name to analyze (required)
 * @param {number} year - Year to analyze (required)
 * 
 * @returns {Array<Object>} Array of outlier states:
 *   - stateName: Name of the outlier state
 *   - perCapita: Per-capita rate for the state
 *   - avgRate: National average rate
 *   - stdRate: Standard deviation of rates
 * 
 * @example
 * GET /api/states-high-outliers?diseaseName=Influenza&year=2023
 */
const getStatesHighOutliers = async (req, res) => {
    try {
      const { diseaseName, year } = req.query;
      const yr = parseInt(year, 10);
      if (!diseaseName || isNaN(yr)) {
        return res.status(400).json({ error: 'diseaseName and year required' });
      }
      const sql = `
        WITH state_stats AS (
          SELECT 
            r.state_name,
            SUM(cw.current_week_cases)::NUMERIC / NULLIF(p.population, 0) * 100000 AS per_capita
          FROM fact_cases_weekly cw
          JOIN dim_region r ON cw.region_id = r.region_id
          JOIN dim_disease d ON cw.disease_id = d.disease_id
          JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = LEAST($2, 2023)
          WHERE d.disease_name = $1 AND cw.year = $2
          GROUP BY r.state_name, p.population
        ),
        agg_stats AS (
          SELECT AVG(per_capita) as avg_rate, STDDEV(per_capita) as std_rate
          FROM state_stats
        )
        SELECT 
          s.state_name AS "stateName",
          s.per_capita AS "perCapita",
          a.avg_rate AS "avgRate",
          a.std_rate AS "stdRate"
        FROM state_stats s, agg_stats a
        WHERE s.per_capita > (a.avg_rate + a.std_rate)
        ORDER BY s.per_capita DESC;
      `;
      const q = await pool.query(sql, [diseaseName, yr]);
      
      // The SQL now returns the outlier rows directly with stats included
      const outliers = q.rows.map(row => ({
        stateName: row.stateName,
        perCapita: Number(row.perCapita),
        avgRate: Number(row.avgRate),
        stdRate: Number(row.stdRate)
      }));
      
      res.json(outliers);
    } catch (err) {
      console.error('Error in /api/states-high-outliers:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getStatesHighOutliers;