const { Pool } = require('pg');

const pool = new Pool({
  host: 'disease-db.cpg660m0m56u.us-east-1.rds.amazonaws.com',
  user: 'cis550_admin',
  password: 'CIS5500Project',
  port: 5432,
  database: 'disease_app',
  ssl: { rejectUnauthorized: false },
});

async function checkPopulation() {
  try {
    const result = await pool.query('SELECT DISTINCT year FROM fact_population_state_year ORDER BY year');
    console.log('Population years:', result.rows.map(r => r.year));
    
    const result2 = await pool.query('SELECT COUNT(*) FROM fact_population_state_year WHERE year = 2025');
    console.log('Population records for 2025:', result2.rows[0].count);
    
    const result3 = await pool.query('SELECT COUNT(*) FROM fact_cases_weekly WHERE year = 2025');
    console.log('Cases records for 2025:', result3.rows[0].count);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkPopulation();
