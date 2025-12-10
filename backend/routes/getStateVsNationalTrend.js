const { pool } = require('../db');

/**
 * GET /api/state-vs-national-trend
 * 
 * Compares state-level and national-level disease rates over a year range.
 * Returns per-100k rates for both state and national levels for each year.
 * Useful for trend visualization and identifying divergence patterns.
 * 
 * @param {string} diseaseName - Disease name to analyze (required)
 * @param {string} stateName - Full state name (required)
 * @param {number} startYear - First year of comparison (required)
 * @param {number} endYear - Last year of comparison (required, must be >= startYear)
 * 
 * @returns {Array<Object>} Array of yearly comparison data:
 *   - year: Year of the data point
 *   - stateCasesPer100k: State-level cases per 100,000
 *   - nationalCasesPer100k: National-level cases per 100,000
 * 
 * @example
 * GET /api/state-vs-national-trend?diseaseName=COVID-19&stateName=California&startYear=2020&endYear=2023
 */
const getStateVsNationalTrend = async (req, res) => {
    try {
      const { diseaseName, stateName, startYear, endYear } = req.query;
      const y0 = parseInt(startYear, 10), y1 = parseInt(endYear, 10);
      if (!diseaseName || !stateName || isNaN(y0) || isNaN(y1) || y1 < y0) {
        return res.status(400).json({ error: 'diseaseName, stateName, startYear, endYear required' });
      }
      const stateSql = `
        SELECT f.year, SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population,0) * 100000 AS state_rate
        FROM fact_cases_weekly f
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = LEAST(f.year, 2023)
        WHERE r.state_name = $1 AND d.disease_name = $2 AND f.year BETWEEN $3 AND $4
        GROUP BY f.year, p.population
        ORDER BY f.year
        `;
      const stRes = await pool.query(stateSql, [stateName, diseaseName, y0, y1]);
      
      const natlSql = `
        SELECT f.year, SUM(f.current_week_cases)::NUMERIC / NULLIF(SUM(p.population),0) * 100000 AS natl_rate
        FROM fact_cases_weekly f
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN fact_population_state_year p ON p.region_id = f.region_id AND p.year = LEAST(f.year, 2023)
        WHERE d.disease_name = $1 AND f.year BETWEEN $2 AND $3
        GROUP BY f.year
        ORDER BY f.year`;
      const natlRes = await pool.query(natlSql, [diseaseName, y0, y1]);
      
      const data = [];
      for(const yr of Array.from({length:y1-y0+1},(_,i)=>y0+i)) {
        const stObj = stRes.rows.find(r=>parseInt(r.year,10)===yr);
        const ntObj = natlRes.rows.find(r=>parseInt(r.year,10)===yr);
        data.push({
          year: yr,
          stateCasesPer100k: stObj ? Number(stObj.state_rate):0,
          nationalCasesPer100k: ntObj ? Number(ntObj.natl_rate):0
        });
      }
      res.json(data);
    } catch(err) {
      console.error('Error in /api/state-vs-national-trend:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getStateVsNationalTrend;