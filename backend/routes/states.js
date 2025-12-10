const { pool } = require('../db');

/**
 * GET /api/states
 * 
 * Retrieves a list of all states with their codes and names.
 * Used for populating dropdown filters in the frontend.
 * 
 * @returns {Array<Object>} Array of state objects:
 *   - stateCode: Two-letter state code (e.g., "CA")
 *   - stateName: Full state name (e.g., "California")
 * 
 * @example
 * GET /api/states
 * Response: [{ stateCode: "CA", stateName: "California" }, ...]
 */
const getStates = async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT state_code AS "stateCode",
                state_name AS "stateName"
         FROM dim_region
         ORDER BY state_name;`
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/states:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getStates;