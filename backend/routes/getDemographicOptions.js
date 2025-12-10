const { pool } = require('../db');


/**
 * GET /api/demographic-options
 * 
 * Retrieves all available demographic filter options (races, sexes, age groups).
 * Used to populate demographic selection dropdowns in the frontend.
 * 
 * @returns {Object} Object containing arrays of available options:
 *   - races: Array of race/ethnicity categories
 *   - sexes: Array of sex categories
 *   - ageGroups: Array of age group categories
 * 
 * @example
 * GET /api/demographic-options
 * Response: { races: ["White", "Black", ...], sexes: ["Male", "Female"], ageGroups: ["0-17", "18-64", ...] }
 */
const getDemographicOptions = async (req, res) => {
    try {
      const racesQ = pool.query('SELECT DISTINCT race FROM fact_population_state_demo_year ORDER BY race');
      const sexesQ = pool.query('SELECT DISTINCT sex FROM fact_population_state_demo_year ORDER BY sex');
      const agesQ = pool.query('SELECT DISTINCT age_group FROM fact_population_state_demo_year ORDER BY age_group');
      const [racesRes, sexesRes, agesRes] = await Promise.all([racesQ, sexesQ, agesQ]);
      const races = racesRes.rows.map(r => r.race);
      const sexes = sexesRes.rows.map(s => s.sex);
      const ageGroups = agesRes.rows.map(a => a.age_group);
      res.json({ races, sexes, ageGroups });
    } catch (err) {
      console.error('Error in /api/demographic-options:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getDemographicOptions;