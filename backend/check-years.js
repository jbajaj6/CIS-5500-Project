const { Pool } = require('pg');

const pool = new Pool({
  host: 'disease-db.cpg660m0m56u.us-east-1.rds.amazonaws.com',
  user: 'cis550_admin',
  password: 'CIS5500Project',
  port: 5432,
  database: 'disease_app',
  ssl: { rejectUnauthorized: false },
});

async function checkYears() {
  try {
    const result = await pool.query('SELECT DISTINCT year FROM fact_cases_weekly ORDER BY year');
    console.log('Years with data:', result.rows.map(r => r.year));
    
    const result2 = await pool.query('SELECT MIN(year) as min_year, MAX(year) as max_year FROM fact_cases_weekly');
    console.log('Year range:', result2.rows[0]);
    
    const result3 = await pool.query('SELECT COUNT(*) as count FROM fact_cases_weekly WHERE year = 2020');
    console.log('Records for 2020:', result3.rows[0].count);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkYears();
