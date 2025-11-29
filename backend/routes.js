const { Pool, types } = require('pg');
const config = require('./config.json');

// Force count/sum results to be integers instead of strings
types.setTypeParser(20, (val) => parseInt(val, 10));

const pool = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: { rejectUnauthorized: false },
});

// Helper to keep code clean if you want to use pool.query everywhere
// (The async functions below will use pool directly)

// --- EXISTING ROUTE ---
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

// --- NEW ROUTES ---

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

const getDiseases = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT disease_id AS "diseaseId", disease_name AS "diseaseName"
       FROM dim_disease
       ORDER BY disease_name;`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/diseases:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
            (W.yearly_cases_total::FLOAT / NULLIF(Y.population, 0)) AS "perCapitaYearlyCases"
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

const getStateWeeklyPercapita = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    const week = parseInt(req.query.week, 10);
    const diseaseIds = req.query.diseaseIds
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(x => !isNaN(x));
    if (Number.isNaN(year) || Number.isNaN(week) || diseaseIds.length === 0) {
      return res.status(400).json({ error: 'year, week, and diseaseIds[] are required' });
    }
    const sql = `
      WITH percap_state_week AS (
        SELECT
          r.state_name,
          d.disease_name,
          f.disease_id,
          f.region_id,
          SUM(COALESCE(f.current_week_cases, 0)) AS weekly_cases
        FROM fact_cases_weekly f
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN dim_disease d ON f.disease_id = d.disease_id
        WHERE f.year = $1 AND f.week = $2 AND f.disease_id = ANY($3::int[])
        GROUP BY r.state_name, d.disease_name, f.disease_id, f.region_id
      ), percap_state_52wkmax AS (
        SELECT
          f.region_id,
          f.disease_id,
          MAX(SUM(COALESCE(f.current_week_cases, 0))) OVER (PARTITION BY f.region_id, f.disease_id) AS max_52w_cases
        FROM fact_cases_weekly f
        WHERE f.year = $1 AND f.week BETWEEN GREATEST($2-51,1) AND $2 AND f.disease_id = ANY($3::int[])
        GROUP BY f.region_id, f.disease_id, f.week
      )
      SELECT
        psw.state_name,
        psw.disease_name,
        (psw.weekly_cases::NUMERIC / NULLIF(p.population,0)) AS "perCapitaWeeklyCases",
        (ps52.max_52w_cases::NUMERIC / NULLIF(p.population,0)) AS "perCapita52WeekMax"
      FROM percap_state_week psw
      JOIN percap_state_52wkmax ps52
        ON psw.region_id = ps52.region_id AND psw.disease_id = ps52.disease_id
      JOIN fact_population_state_year p
        ON p.region_id = psw.region_id AND p.year = LEAST($1, 2023)
      ORDER BY psw.state_name, psw.disease_name;
    `;
    const result = await pool.query(sql, [year, week, diseaseIds]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/state-weekly-percapita:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

const getDeathsByPathogenDemographic = async (req, res) => {
  try {
    const { pathogen, yearStart, yearEnd, monthStart, monthEnd, demographicType, demographicValue } = req.query;
    if (!(pathogen && yearStart && yearEnd && monthStart && monthEnd && demographicType && demographicValue)) {
      return res.status(400).json({ error: 'Missing required query params.' });
    }
    const demoCol = {
      'Age Group': 'age_group',
      'Sex': 'sex',
      'Race/Hispanic': 'race'
    }[demographicType];
    if (!demoCol) return res.status(400).json({ error: 'Invalid demographicType.' });
    
    const sqlTotal = `SELECT SUM(deaths) AS total
      FROM fact_deaths
      WHERE disease_name = $1
        AND year BETWEEN $2 AND $3
        AND month BETWEEN $4 AND $5
        AND ${demoCol} = $6`;
    const sqlAll = `SELECT SUM(deaths) AS all_total
      FROM fact_deaths
      WHERE disease_name = $1
        AND year BETWEEN $2 AND $3
        AND month BETWEEN $4 AND $5`;
    
    const totalRes = await pool.query(sqlTotal, [pathogen, yearStart, yearEnd, monthStart, monthEnd, demographicValue]);
    const allRes = await pool.query(sqlAll, [pathogen, yearStart, yearEnd, monthStart, monthEnd]);
    
    const totalDeaths = Number(totalRes.rows[0].total)||0;
    const sumOfTotalDeaths = Number(allRes.rows[0].all_total)||0;
    const percentDeaths = sumOfTotalDeaths ? (totalDeaths/sumOfTotalDeaths)*100 : 0;
    res.json({ pathogen, totalDeaths, sumOfTotalDeaths, percentDeaths });
  } catch (err) {
    console.error('Error in /api/deaths-by-pathogen-demographic:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getEstimatedDemographicCases = async (req, res) => {
  try {
    const { stateName, diseaseName, year, race, sex, ageGroup } = req.query;
    if (!stateName || !diseaseName || !year || !race || !sex || !ageGroup) {
      return res.status(400).json({ error: 'Missing required query params.' });
    }
    const popSql = `SELECT P.population, R.state_code
      FROM fact_population_state_demo_year P
      JOIN dim_region R ON P.region_id = R.region_id
      WHERE R.state_name = $1 AND P.year = $2 AND P.race = $3 AND P.sex = $4 AND P.age_group = $5`;
    const popRes = await pool.query(popSql, [stateName, year, race, sex, ageGroup]);
    if (popRes.rows.length === 0)
      return res.status(404).json({ error: 'No matching demographic population found.' });
    const { population, state_code } = popRes.rows[0];
    
    const totalCasesSql = `SELECT SUM(f.current_week_cases) AS total_yearly_cases
      FROM fact_cases_weekly f
      JOIN dim_region r ON f.region_id = r.region_id
      JOIN dim_disease d ON f.disease_id = d.disease_id
      WHERE r.state_name = $1 AND d.disease_name = $2 AND f.year = $3`;
    const casesRes = await pool.query(totalCasesSql, [stateName, diseaseName, year]);
    const totalYearlyCases = Number(casesRes.rows[0].total_yearly_cases)||0;
    
    const allPopSql = `SELECT population FROM fact_population_state_demo_year P JOIN dim_region R ON P.region_id = R.region_id WHERE R.state_name = $1 AND P.year = $2`;
    const allPopRes = await pool.query(allPopSql, [stateName, year]);
    const totalStateDemoPop = allPopRes.rows.reduce((sum, row) => sum + Number(row.population||0), 0);
    
    const estimatedDemographicCases = totalStateDemoPop ? Math.round((population / totalStateDemoPop) * totalYearlyCases) : 0;
    const casesPer100k = population ? (estimatedDemographicCases / population) * 100000 : 0;
    res.json({
      stateName,
      stateCode: state_code,
      diseaseName,
      year: Number(year),
      race,
      sex,
      ageGroup,
      population: Number(population),
      totalYearlyCases,
      estimatedDemographicCases,
      casesPer100k: Number(casesPer100k.toFixed(2))
    });
  } catch (err) {
    console.error('Error in /api/estimated-demographic-cases:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTopStatesByDisease = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    let diseaseIds = [];
    if (req.query.diseaseIds) {
      diseaseIds = req.query.diseaseIds
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(x => !isNaN(x));
    }
    if (Number.isNaN(year)) {
      return res.status(400).json({ error: 'year is required and must be integer' });
    }
    let sql = `
      SELECT r.state_name AS "stateName",
             d.disease_name AS "diseaseName",
             $1 AS "year",
             SUM(f.current_week_cases) AS "totalCases",
             p.population AS "totalPopulation",
             (SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population,0))*100000 AS "casesPer100k"
      FROM fact_cases_weekly f
      JOIN dim_region r ON f.region_id = r.region_id
      JOIN dim_disease d ON f.disease_id = d.disease_id
      JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = LEAST($1, 2023)
      WHERE f.year = $1
      ${diseaseIds.length > 0 ? 'AND f.disease_id = ANY($2::int[])' : ''}
      GROUP BY r.state_name, d.disease_name, p.population
      ORDER BY "casesPer100k" DESC NULLS LAST
      LIMIT 10;`;
    const params = [year];
    if (diseaseIds.length > 0) params.push(diseaseIds);
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/top-states-by-disease:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStatesRising4Years = async (req, res) => {
  try {
    const { diseaseName, startYear, endYear } = req.query;
    const y0 = parseInt(startYear, 10), y3 = parseInt(endYear, 10);
    if (!diseaseName || isNaN(y0) || isNaN(y3) || y3 - y0 !== 3) {
      return res.status(400).json({ error: 'Provide diseaseName, startYear, endYear (4-year window)' });
    }
    const sql = `
      SELECT r.state_name, f.year,
       SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population,0) AS rate
      FROM fact_cases_weekly f
      JOIN dim_disease d ON f.disease_id = d.disease_id
      JOIN dim_region r ON f.region_id = r.region_id
      JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = LEAST(f.year, 2023)
      WHERE f.year BETWEEN $1 AND $2
        AND d.disease_name = $3
      GROUP BY r.state_name, f.year, p.population
      ORDER BY r.state_name, f.year`;
    const q = await pool.query(sql, [y0, y3, diseaseName]);
    const byState = {};
    for (const row of q.rows) {
      if (!byState[row.state_name]) byState[row.state_name] = [];
      byState[row.state_name][row.year - y0] = Number(row.rate)||0;
    }
    const risingStates = Object.entries(byState).filter(
      ([, arr]) => arr.length === 4 && arr[0] < arr[1] && arr[1] < arr[2] && arr[2] < arr[3]
    ).map(([state]) => ({ stateName: state }));
    res.json(risingStates);
  } catch (err) {
    console.error('Error in /api/states-rising-4years:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStatesHighOutliers = async (req, res) => {
  try {
    const { diseaseName, year } = req.query;
    const yr = parseInt(year, 10);
    if (!diseaseName || isNaN(yr)) {
      return res.status(400).json({ error: 'diseaseName and year required' });
    }
    const sql = `
      SELECT r.state_name,
        SUM(cw.current_week_cases)::NUMERIC/nullif(p.population,0) AS percapita
      FROM fact_cases_weekly cw
      JOIN dim_region r ON cw.region_id = r.region_id
      JOIN dim_disease d ON cw.disease_id = d.disease_id
      JOIN fact_population_state_year p ON p.region_id=r.region_id AND p.year=LEAST($2, 2023)
      WHERE d.disease_name=$1 AND cw.year=$2
      GROUP BY r.state_name, p.population`;
    const q = await pool.query(sql, [diseaseName, yr]);
    const all = q.rows.map(row => ({ stateName: row.state_name, perCapita: Number(row.percapita) }));
    const values = all.map(x => x.perCapita);
    const avg = values.reduce((a,b)=>a+b,0)/values.length;
    const std = Math.sqrt(values.reduce((a,b)=>a+Math.pow(b-avg,2),0)/values.length);
    const outliers = all.filter(x => x.perCapita > avg + std)
      .map(x => ({ stateName: x.stateName, perCapita: x.perCapita, avgRate: avg, stdRate: std }));
    res.json(outliers);
  } catch (err) {
    console.error('Error in /api/states-high-outliers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStateDemographicOverUnder = async (req, res) => {
  try {
    const { stateName, diseaseName, year } = req.query;
    if (!stateName || !diseaseName || !year) {
      return res.status(400).json({ error: 'Missing required query params' });
    }
    const sql = `
      SELECT fd.race, fd.sex, fd.age_group,
        SUM(fd.current_week_cases) AS demoCases,
        pop.population AS demoPopulation
      FROM fact_cases_weekly fd
      JOIN dim_region r ON fd.region_id = r.region_id
      JOIN dim_disease d ON fd.disease_id = d.disease_id
      JOIN fact_population_state_demo_year pop ON fd.region_id = pop.region_id AND fd.year = pop.year AND fd.race = pop.race AND fd.sex = pop.sex AND fd.age_group = pop.age_group
      WHERE r.state_name = $1 AND d.disease_name = $2 AND fd.year = $3
      GROUP BY fd.race, fd.sex, fd.age_group, pop.population`;
    const q = await pool.query(sql, [stateName, diseaseName, year]);
    const totalCases = q.rows.reduce((sum, r) => sum + Number(r.democases||0),0);
    const totalPop = q.rows.reduce((sum, r) => sum + Number(r.demopopulation||0),0);
    const response = q.rows.map(row => {
      const shareOfCases = totalCases ? Number(row.democases||0)/totalCases : 0;
      const shareOfPop = totalPop ? Number(row.demopopulation||0)/totalPop : 0;
      return {
        race: row.race,
        sex: row.sex,
        ageGroup: row.age_group,
        demoCases: Number(row.democases||0),
        demoPopulation: Number(row.demopopulation||0),
        shareOfCases: Number(shareOfCases.toFixed(4)),
        shareOfPopulation: Number(shareOfPop.toFixed(4)),
        overUnderExposure: Number((shareOfCases-shareOfPop).toFixed(4))
      }
    });
    res.json(response);
  } catch (err) {
    console.error('Error in /api/state-demographic-overunder:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStatesBelowNationalAllRaces = async (req, res) => {
  try {
    const { diseaseName, year } = req.query;
    const yr = parseInt(year, 10);
    if (!diseaseName || isNaN(yr)) {
      return res.status(400).json({ error: 'diseaseName and year required' });
    }
    const natlSql = `
      SELECT f.race, SUM(f.current_week_cases)::NUMERIC / NULLIF(SUM(pop.population),0) AS natl_per_cap
      FROM fact_cases_weekly f
      JOIN dim_disease d ON f.disease_id = d.disease_id
      JOIN fact_population_state_demo_year pop ON f.region_id = pop.region_id and f.year=pop.year and f.race=pop.race
      WHERE d.disease_name=$1 AND f.year=$2
      GROUP BY f.race`;
    const natlQ = await pool.query(natlSql, [diseaseName, yr]);
    const natlByRace = {};
    for(const r of natlQ.rows) natlByRace[r.race] = Number(r.natl_per_cap) || 0;
    
    const stateSql = `
      SELECT r.state_name, f.race, SUM(f.current_week_cases)::NUMERIC / NULLIF(SUM(pop.population),0) AS st_per_cap
      FROM fact_cases_weekly f
      JOIN dim_disease d ON f.disease_id = d.disease_id
      JOIN dim_region r ON f.region_id = r.region_id
      JOIN fact_population_state_demo_year pop ON f.region_id = pop.region_id and f.year=pop.year and f.race=pop.race
      WHERE d.disease_name=$1 AND f.year=$2
      GROUP BY r.state_name, f.race`;
    const stQ = await pool.query(stateSql, [diseaseName, yr]);
    
    const races = Object.keys(natlByRace);
    const stateMap = {};
    for(const row of stQ.rows) {
      if (!stateMap[row.state_name]) stateMap[row.state_name]={};
      stateMap[row.state_name][row.race] = Number(row.st_per_cap)||0;
    }
    const passingStates = Object.entries(stateMap).filter(
      ([, byRace])=> races.every(r=> {
        const st = byRace[r];
        const natl = natlByRace[r];
        return st!==undefined && st< natl;
      })
    ).map(([name])=>({stateName:name}));
    res.json(passingStates);
  } catch(err) {
    console.error('Error in /api/states-below-national-all-races:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStateVsNationalTrend = async (req, res) => {
  try {
    const { diseaseName, stateName, startYear, endYear } = req.query;
    const y0 = parseInt(startYear, 10), y1 = parseInt(endYear, 10);
    if (!diseaseName || !stateName || isNaN(y0) || isNaN(y1) || y1 < y0) {
      return res.status(400).json({ error: 'diseaseName, stateName, startYear, endYear required' });
    }
    const stateSql = `
      SELECT f.year, SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population,0)*100000 AS state_rate
      FROM fact_cases_weekly f
      JOIN dim_region r ON f.region_id = r.region_id
      JOIN dim_disease d ON f.disease_id = d.disease_id
      JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = LEAST(f.year, 2023)
      WHERE r.state_name = $1 AND d.disease_name = $2 AND f.year BETWEEN $3 AND $4
      GROUP BY f.year, p.population
      ORDER BY f.year`;
    const stRes = await pool.query(stateSql, [stateName, diseaseName, y0, y1]);
    
    const natlSql = `
      SELECT f.year, SUM(f.current_week_cases)::NUMERIC / NULLIF(SUM(p.population),0)*100000 AS natl_rate
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

module.exports = {
  disease,
  getStates,
  getDiseases,
  getStateYearlyPercapita,
  getStateWeeklyPercapita,
  getDemographicOptions,
  getDeathsByPathogenDemographic,
  getEstimatedDemographicCases,
  getTopStatesByDisease,
  getStatesRising4Years,
  getStatesHighOutliers,
  getStateDemographicOverUnder,
  getStatesBelowNationalAllRaces,
  getStateVsNationalTrend
};