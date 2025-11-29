
/**
 * Route: GET /api/states
 * Returns list of states from dim_region
 */
app.get('/api/states', async (req, res) => {
    try {
      const result = await db.query(
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
  });
  
  /**
   * Route: GET /api/diseases
   * Returns list of diseases from dim_disease (for dropdowns, UI)
   */
  app.get('/api/diseases', async (req, res) => {
    try {
      const result = await db.query(
        `SELECT disease_id AS "diseaseId", disease_name AS "diseaseName"
         FROM dim_disease
         ORDER BY disease_name;`
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/diseases:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * Route: GET /api/state-yearly-percapita
   * Query 2
   */
  app.get('/api/state-yearly-percapita', async (req, res) => {
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
            WHERE P.year = $1
        )
        SELECT Y.state_name AS "stateName",
               D.disease_name AS "diseaseName",
               (W.yearly_cases_total::FLOAT / NULLIF(Y.population, 0)) AS "perCapitaYearlyCases"
        FROM yearly_cases W
        JOIN year_state_populations Y ON W.region_id = Y.region_id
        JOIN dim_disease D ON D.disease_id = W.disease_id
        ORDER BY "perCapitaYearlyCases" DESC NULLS LAST;
      `;
      const result = await db.query(sql, [year, diseaseId]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/state-yearly-percapita:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * Route: GET /api/state-weekly-percapita
   * Query 1: for a given week and diseaseIds, get per-capita rate and 52-week max for each state/disease
   * Params: year (int), week (int), diseaseIds (CSV string)
   */
  app.get('/api/state-weekly-percapita', async (req, res) => {
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
          ON p.region_id = psw.region_id AND p.year = $1
        ORDER BY psw.state_name, psw.disease_name;
      `;
      const result = await db.query(sql, [year, week, diseaseIds]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/state-weekly-percapita:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * Route: GET /api/demographic-options
   * Returns all race, sex, and age group values for UI filtering
   */
  app.get('/api/demographic-options', async (req, res) => {
    try {
      const racesQ = db.query('SELECT DISTINCT race FROM fact_population_state_demo_year ORDER BY race');
      const sexesQ = db.query('SELECT DISTINCT sex FROM fact_population_state_demo_year ORDER BY sex');
      const agesQ = db.query('SELECT DISTINCT age_group FROM fact_population_state_demo_year ORDER BY age_group');
      const [racesRes, sexesRes, agesRes] = await Promise.all([racesQ, sexesQ, agesQ]);
      const races = racesRes.rows.map(r => r.race);
      const sexes = sexesRes.rows.map(s => s.sex);
      const ageGroups = agesRes.rows.map(a => a.age_group);
      res.json({ races, sexes, ageGroups });
    } catch (err) {
      console.error('Error in /api/demographic-options:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * Route: GET /api/deaths-by-pathogen-demographic
   * For a pathogen + demographic slice, compute total and % of all deaths
   * Params: pathogen, yearStart, yearEnd, monthStart, monthEnd, demographicType, demographicValue
   */
  app.get('/api/deaths-by-pathogen-demographic', async (req, res) => {
    try {
      const { pathogen, yearStart, yearEnd, monthStart, monthEnd, demographicType, demographicValue } = req.query;
      if (!(pathogen && yearStart && yearEnd && monthStart && monthEnd && demographicType && demographicValue)) {
        return res.status(400).json({ error: 'Missing required query params.' });
      }
      // Map demographicType to column
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
      // Run both queries
      const totalRes = await db.query(sqlTotal, [pathogen, yearStart, yearEnd, monthStart, monthEnd, demographicValue]);
      const allRes = await db.query(sqlAll, [pathogen, yearStart, yearEnd, monthStart, monthEnd]);
      const totalDeaths = Number(totalRes.rows[0].total)||0;
      const sumOfTotalDeaths = Number(allRes.rows[0].all_total)||0;
      const percentDeaths = sumOfTotalDeaths ? (totalDeaths/sumOfTotalDeaths)*100 : 0;
      res.json({ pathogen, totalDeaths, sumOfTotalDeaths, percentDeaths });
    } catch (err) {
      console.error('Error in /api/deaths-by-pathogen-demographic:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * Route: GET /api/estimated-demographic-cases
   * Query 4: estimated number of cases and cases per 100k for demographic group in state/year/disease
   * Params: stateName, diseaseName, year, race, sex, ageGroup
   */
  app.get('/api/estimated-demographic-cases', async (req, res) => {
    try {
      const { stateName, diseaseName, year, race, sex, ageGroup } = req.query;
      if (!stateName || !diseaseName || !year || !race || !sex || !ageGroup) {
        return res.status(400).json({ error: 'Missing required query params.' });
      }
      // Get demographic population
      const popSql = `SELECT P.population, R.state_code
        FROM fact_population_state_demo_year P
        JOIN dim_region R ON P.region_id = R.region_id
        WHERE R.state_name = $1 AND P.year = $2 AND P.race = $3 AND P.sex = $4 AND P.age_group = $5`;
      const popRes = await db.query(popSql, [stateName, year, race, sex, ageGroup]);
      if (popRes.rows.length === 0)
        return res.status(404).json({ error: 'No matching demographic population found.' });
      const { population, state_code } = popRes.rows[0];
      // Get total yearly cases for state/disease/year
      const totalCasesSql = `SELECT SUM(f.current_week_cases) AS total_yearly_cases
        FROM fact_cases_weekly f
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN dim_disease d ON f.disease_id = d.disease_id
        WHERE r.state_name = $1 AND d.disease_name = $2 AND f.year = $3`;
      const casesRes = await db.query(totalCasesSql, [stateName, diseaseName, year]);
      const totalYearlyCases = Number(casesRes.rows[0].total_yearly_cases)||0;
      // Get all demo populations in state/year
      const allPopSql = `SELECT population FROM fact_population_state_demo_year P JOIN dim_region R ON P.region_id = R.region_id WHERE R.state_name = $1 AND P.year = $2`;
      const allPopRes = await db.query(allPopSql, [stateName, year]);
      const totalStateDemoPop = allPopRes.rows.reduce((sum, row) => sum + Number(row.population||0), 0);
      // Proportional estimate logic:
      // estimatedCases = pop_of_demo / total_state_demo_pop * totalYearlyCases
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
  });
  
  /**
   * Route: GET /api/top-states-by-disease
   * Query 5: Top 10 states by cases per 100k for given year/diseases
   * Params: year (int, required), diseaseIds (CSV string, optional)
   */
  app.get('/api/top-states-by-disease', async (req, res) => {
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
        JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = $1
        WHERE f.year = $1
        ${diseaseIds.length > 0 ? 'AND f.disease_id = ANY($2::int[])' : ''}
        GROUP BY r.state_name, d.disease_name, p.population
        ORDER BY "casesPer100k" DESC NULLS LAST
        LIMIT 10;`;
      const params = [year];
      if (diseaseIds.length > 0) params.push(diseaseIds);
      const result = await db.query(sql, params);
      res.json(result.rows);
    } catch (err) {
      console.error('Error in /api/top-states-by-disease:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * Route: GET /api/states-rising-4years
   * Query 6: Return states with monotone increasing per-capita yearly cases over 4 years for disease
   * Params: diseaseName, startYear, endYear (must be 4-year window)
   */
  app.get('/api/states-rising-4years', async (req, res) => {
    try {
      const { diseaseName, startYear, endYear } = req.query;
      const y0 = parseInt(startYear, 10), y3 = parseInt(endYear, 10);
      if (!diseaseName || isNaN(y0) || isNaN(y3) || y3 - y0 !== 3) {
        return res.status(400).json({ error: 'Provide diseaseName, startYear, endYear (4-year window)' });
      }
      // Query: Get per-capita rates for states/disease for all four years, then filter in JS for monotonic increase
      const sql = `
        SELECT r.state_name, f.year,
         SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population,0) AS rate
        FROM fact_cases_weekly f
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = f.year
        WHERE f.year BETWEEN $1 AND $2
          AND d.disease_name = $3
        GROUP BY r.state_name, f.year, p.population
        ORDER BY r.state_name, f.year`;
      const q = await db.query(sql, [y0, y3, diseaseName]);
      // Group by state
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
  });
  
  /**
   * Route: GET /api/states-high-outliers
   * Query 7: For a chosen disease/year return states above mean+stddev for per-capita
   * Params: diseaseName, year
   */
  app.get('/api/states-high-outliers', async (req, res) => {
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
        JOIN fact_population_state_year p ON p.region_id=r.region_id AND p.year=$2
        WHERE d.disease_name=$1 AND cw.year=$2
        GROUP BY r.state_name, p.population`;
      const q = await db.query(sql, [diseaseName, yr]);
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
  });
  
  /**
   * Route: GET /api/state-demographic-overunder
   * Query 8: For state/disease/year, get all demo group case/pop info & over/under
   * Params: stateName, diseaseName, year
   */
  app.get('/api/state-demographic-overunder', async (req, res) => {
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
      const q = await db.query(sql, [stateName, diseaseName, year]);
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
  });
  
  /**
   * Route: GET /api/states-below-national-all-races
   * Query 9: States where EVERY race's per-capita is below natl avg for that race
   * Params: diseaseName, year
   */
  app.get('/api/states-below-national-all-races', async (req, res) => {
    try {
      const { diseaseName, year } = req.query;
      const yr = parseInt(year, 10);
      if (!diseaseName || isNaN(yr)) {
        return res.status(400).json({ error: 'diseaseName and year required' });
      }
      // Step 1: get national per-capita for each race
      const natlSql = `
        SELECT f.race, SUM(f.current_week_cases)::NUMERIC / NULLIF(SUM(pop.population),0) AS natl_per_cap
        FROM fact_cases_weekly f
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN fact_population_state_demo_year pop ON f.region_id = pop.region_id and f.year=pop.year and f.race=pop.race
        WHERE d.disease_name=$1 AND f.year=$2
        GROUP BY f.race`;
      const natlQ = await db.query(natlSql, [diseaseName, yr]);
      const natlByRace = {};
      for(const r of natlQ.rows) natlByRace[r.race] = Number(r.natl_per_cap) || 0;
      // Step 2: get states per-capita for each race
      const stateSql = `
        SELECT r.state_name, f.race, SUM(f.current_week_cases)::NUMERIC / NULLIF(SUM(pop.population),0) AS st_per_cap
        FROM fact_cases_weekly f
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN fact_population_state_demo_year pop ON f.region_id = pop.region_id and f.year=pop.year and f.race=pop.race
        WHERE d.disease_name=$1 AND f.year=$2
        GROUP BY r.state_name, f.race`;
      const stQ = await db.query(stateSql, [diseaseName, yr]);
      // Group by state, check below natl for all races
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
          return st!==undefined && st< natl;  // must exist and be less
        })
      ).map(([name])=>({stateName:name}));
      res.json(passingStates);
    } catch(err) {
      console.error('Error in /api/states-below-national-all-races:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * Route: GET /api/state-vs-national-trend
   * Query 10: per-100k yearly rates for state and national
   * Params: diseaseName, stateName, startYear, endYear
   */
  app.get('/api/state-vs-national-trend', async (req, res) => {
    try {
      const { diseaseName, stateName, startYear, endYear } = req.query;
      const y0 = parseInt(startYear, 10), y1 = parseInt(endYear, 10);
      if (!diseaseName || !stateName || isNaN(y0) || isNaN(y1) || y1 < y0) {
        return res.status(400).json({ error: 'diseaseName, stateName, startYear, endYear required' });
      }
      // Query 1: state rates
      const stateSql = `
        SELECT f.year, SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population,0)*100000 AS state_rate
        FROM fact_cases_weekly f
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = f.year
        WHERE r.state_name = $1 AND d.disease_name = $2 AND f.year BETWEEN $3 AND $4
        GROUP BY f.year, p.population
        ORDER BY f.year`;
      const stRes = await db.query(stateSql, [stateName, diseaseName, y0, y1]);
      // Query 2: national rates
      const natlSql = `
        SELECT f.year, SUM(f.current_week_cases)::NUMERIC / NULLIF(SUM(p.population),0)*100000 AS natl_rate
        FROM fact_cases_weekly f
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN fact_population_state_year p ON p.region_id = f.region_id AND p.year = f.year
        WHERE d.disease_name = $1 AND f.year BETWEEN $2 AND $3
        GROUP BY f.year
        ORDER BY f.year`;
      const natlRes = await db.query(natlSql, [diseaseName, y0, y1]);
      // Combine on year
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
  });
  
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });