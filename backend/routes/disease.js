const { pool } = require('../db');


const disease = async function (req, res) {
    const pageSize = parseInt(req.query.page_size, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * pageSize;
  
    const sql = `
      WITH disease_state AS (
        SELECT
          d.disease_name,
          r.state_name,
          SUM(f.current_week_cases) AS total_cases,
          SUM(f.current_week_cases)::decimal / NULLIF(SUM(p.population), 0) AS per_capita_rate
        FROM fact_cases_weekly f
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN fact_population_state_year p ON p.region_id = f.region_id AND p.year = 2023
        GROUP BY d.disease_name, r.state_name
      )
      SELECT * FROM disease_state
      ORDER BY per_capita_rate DESC
      LIMIT $1 OFFSET $2;
    `;
  
    try {
      const result = await pool.query(sql, [pageSize, offset]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error running /disease query:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };

  module.exports = disease;