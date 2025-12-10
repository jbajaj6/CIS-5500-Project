const { pool } = require('../db');


/**
 * GET /api/diseases
 * 
 * Retrieves a list of all diseases/pathogens tracked in the system.
 * Used for populating disease selection dropdowns.
 * 
 * @param {number} [year] - Optional year filter. If provided, only returns diseases
 *                         that have at least one case record for that year.
 * 
 * @returns {Array<Object>} Array of disease objects:
 *   - diseaseId: Unique disease identifier
 *   - diseaseName: Name of the disease/pathogen
 * 
 * @example
 * GET /api/diseases
 * GET /api/diseases?year=2023
 * Response: [{ diseaseId: 1, diseaseName: "COVID-19" }, ...]
 */
const getDiseases = async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year, 10) : null;
  
      let sql;
      let params = [];
  
      if (!Number.isNaN(year) && year) {
        // Only diseases that have at least one row in fact_cases_weekly for that year
        // -> existential check via EXISTS
        sql = `
          SELECT
            d.disease_id AS "diseaseId",
            d.disease_name AS "diseaseName"
          FROM dim_disease d
          WHERE EXISTS (
            SELECT 1
            FROM fact_cases_weekly f
            WHERE f.disease_id = d.disease_id
              AND f.year = $1
          )
          ORDER BY d.disease_name;
        `;
        params = [year];
      } else {
        // Original behaviour (all diseases)
        sql = `
          SELECT
            disease_id AS "diseaseId",
            disease_name AS "diseaseName"
          FROM dim_disease
          ORDER BY disease_name;
        `;
      }
  
      const result = await pool.query(sql, params);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/diseases:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getDiseases;