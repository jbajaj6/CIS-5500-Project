const { pool } = require('../db');

/**
 * GET /api/state-yearly-percapita
 * 
 * Calculates yearly per-capita disease rates (per 100,000 population) for all states
 * for a given year and disease. Results are ordered by rate (descending).
 * 
 * @param {number} year - Year to analyze (required)
 * @param {number} diseaseId - Disease ID to filter by (required)
 * 
 * @returns {Array<Object>} Array of state-yearly-rate objects:
 *   - stateName: Name of the state
 *   - diseaseName: Name of the disease
 *   - perCapitaYearlyCases: Cases per 100,000 population
 * 
 * @example
 * GET /api/state-yearly-percapita?year=2023&diseaseId=1
 */
const getStateYearlyPercapita = async (req, res) => {
    try {
      const year = parseInt(req.query.year, 10);
      const diseaseId = parseInt(req.query.diseaseId, 10);
      if (Number.isNaN(year) || Number.isNaN(diseaseId)) {
        return res.status(400).json({ error: 'year and diseaseId must be integers' });
      }
      const sql = `
        WITH yearly_cases AS (
            SELECT F.region_id,
                   F.disease_id,
                   SUM(COALESCE(F.current_week_cases, 0)) AS yearly_cases_total
            FROM fact_cases_weekly F
            WHERE F.year = $1
              AND F.disease_id = $2
            GROUP BY F.region_id, F.disease_id
        ),
        year_state_populations AS (
            SELECT P.region_id,
                   P.population,
                   R.state_name
            FROM fact_population_state_year P
            JOIN dim_region R ON P.region_id = R.region_id
            WHERE P.year = LEAST($1, 2023)
        )
        SELECT Y.state_name AS "stateName",
              D.disease_name AS "diseaseName",
              (W.yearly_cases_total::FLOAT / NULLIF(Y.population, 0)) * 100000 AS "perCapitaYearlyCases"
        FROM yearly_cases W
        JOIN year_state_populations Y ON W.region_id = Y.region_id
        JOIN dim_disease D ON D.disease_id = W.disease_id
        ORDER BY "perCapitaYearlyCases" DESC NULLS LAST;
      `;
      const result = await pool.query(sql, [year, diseaseId]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/state-yearly-percapita:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getStateYearlyPercapita;