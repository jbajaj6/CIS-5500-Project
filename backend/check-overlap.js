const { Pool } = require('pg');

const pool = new Pool({
  host: 'disease-db.cpg660m0m56u.us-east-1.rds.amazonaws.com',
  user: 'cis550_admin',
  password: 'CIS5500Project',
  port: 5432,
  database: 'disease_app',
  ssl: { rejectUnauthorized: false },
});

async function checkDataOverlap() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT f.year 
      FROM fact_cases_weekly f
      INNER JOIN fact_population_state_year p ON p.year = f.year
      ORDER BY f.year DESC
    `);
    console.log('Years with  BOTH case AND population data:', result.rows.map(r => r.year));
    
    const result2 = await pool.query(`
      SELECT f.year, COUNT(*) as case_count
      FROM fact_cases_weekly f
      INNER JOIN fact_population_state_year p ON p.year = f.year AND p.region_id = f.region_id
      GROUP BY f.year
      ORDER BY f.year DESC
    `);
    console.log('\nOverlapping records by year:');
    result2.rows.forEach(r => console.log(`  ${r.year}: ${r.case_count} records`));
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkDataOverlap();
