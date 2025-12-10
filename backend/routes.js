/**
 * API Route Handlers
 * 
 * This module contains all API endpoint handlers for the Disease Analytics Platform.
 * Each function handles a specific endpoint, executes database queries, and returns
 * formatted JSON responses.
 * 
 * The routes support various analytical queries including:
 * - Disease case rate calculations (per-capita, weekly, yearly)
 * - Demographic analysis and disparity calculations
 * - Trend identification (rising states, outliers)
 * - State vs national comparisons
 * 
 * @module routes
 * @requires pg
 */

const { Pool, types } = require('pg');
const config = require('./config.json');

/**
 * Configure PostgreSQL Type Parser
 * 
 * Forces BIGINT (type 20) results to be parsed as integers instead of strings.
 * This ensures numeric aggregations (COUNT, SUM) return proper number types.
 */
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

// ============================================================================
// BASIC DATA ENDPOINTS
// ============================================================================

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

// ============================================================================
// CASE RATE ANALYSIS ENDPOINTS
// ============================================================================

/**
 * GET /api/state-yearly-percapita
 * 
 * Calculates yearly per-capita disease rates (per 100,000 population) for all states
 * for a given year and disease. Results are ordered by rate (descending).
 * 
 * @param {number} year - Year to analyze (required)
 * @param {number} diseaseId - Disease ID to filter by (required)
 * 
 * @returns {Array<Object>} Array of state-yearly-rate objects:
 *   - stateName: Name of the state
 *   - diseaseName: Name of the disease
 *   - perCapitaYearlyCases: Cases per 100,000 population
 * 
 * @example
 * GET /api/state-yearly-percapita?year=2023&diseaseId=1
 */
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
            (W.yearly_cases_total::FLOAT / NULLIF(Y.population, 0)) * 100000 AS "perCapitaYearlyCases"
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

/**
 * GET /api/state-weekly-percapita
 * 
 * Calculates weekly per-capita rates and 52-week maximum rates for specified diseases.
 * Useful for comparing current week rates against recent historical peaks.
 * 
 * @param {number} year - Year of the week to analyze (required)
 * @param {number} week - Week number (1-52) to analyze (required)
 * @param {string} diseaseIds - Comma-separated list of disease IDs (required)
 * 
 * @returns {Array<Object>} Array of weekly rate objects:
 *   - state_name: Name of the state
 *   - disease_name: Name of the disease
 *   - perCapitaWeeklyCases: Cases per 100,000 for the specified week
 *   - perCapita52WeekMax: Maximum cases per 100,000 in the past 52 weeks
 * 
 * @example
 * GET /api/state-weekly-percapita?year=2023&week=25&diseaseIds=1,2,3
 */
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
      SELECT DISTINCT
        psw.state_name,
        psw.disease_name,
        (psw.weekly_cases::NUMERIC / NULLIF(p.population,0)) * 100000 AS "perCapitaWeeklyCases",
        (ps52.max_52w_cases::NUMERIC / NULLIF(p.population,0)) * 100000 AS "perCapita52WeekMax"
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

// ============================================================================
// DEMOGRAPHIC ANALYSIS ENDPOINTS
// ============================================================================

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

/**
 * GET /api/deaths-by-pathogen-demographic
 * 
 * Calculates total deaths and percentage of all deaths for a specific pathogen
 * and demographic group for a given year. Accepts exactly one demographic filter
 * (race, sex, or ageGroup) at a time.
 * 
 * @param {string} pathogen - Disease/pathogen name (required)
 * @param {number} year - Year to analyze (required)
 * @param {string} [race] - Optional race/ethnicity filter (exactly one of race/sex/ageGroup required)
 * @param {string} [sex] - Optional sex filter (exactly one of race/sex/ageGroup required)
 * @param {string} [ageGroup] - Optional age group filter (exactly one of race/sex/ageGroup required)
 * 
 * @returns {Object} Death statistics object:
 *   - pathogen: Disease name
 *   - year: Year analyzed
 *   - race, sex, ageGroup: Demographic filters applied (null if not used)
 *   - demographicType: Type of demographic filter used
 *   - demographicValue: Value of the demographic filter
 *   - totalDeaths: Total deaths for the demographic group
 *   - sumOfTotalDeaths: Total deaths for all demographics
 *   - percentDeaths: Percentage of total deaths
 * 
 * @example
 * GET /api/deaths-by-pathogen-demographic?pathogen=COVID-19&year=2023&ageGroup=65+
 */
const getDeathsByPathogenDemographic = async (req, res) => {
  try {
    const { pathogen, year, race, sex, ageGroup } = req.query;
    console.log("Incoming query:", req.query);

    // pathogen + year are always required
    if (!pathogen || !year) {
      return res
        .status(400)
        .json({
          error:
            "Missing required query params: pathogen and year are required.",
        });
    }

    // Normalize inputs (treat empty string as null)
    const raceVal = race && race.trim() !== "" ? race.trim() : null;
    const sexVal = sex && sex.trim() !== "" ? sex.trim() : null;
    const ageGroupVal =
      ageGroup && ageGroup.trim() !== "" ? ageGroup.trim() : null;

    const provided = [];
    if (raceVal) provided.push("race");
    if (sexVal) provided.push("sex");
    if (ageGroupVal) provided.push("age_group");

    if (provided.length === 0) {
      return res
        .status(400)
        .json({ error: "You must provide exactly one of race, sex, or ageGroup." });
    }
    if (provided.length > 1) {
      return res
        .status(400)
        .json({ error: "Provide only one of race, sex, or ageGroup at a time." });
    }

    // Map to demographic dimension filters
    let demoType;        // dim_demographic_flu.demographic
    let demoValue;       // dim_demographic_flu.demographic_values
    let demographicTypeLabel;

    if (provided[0] === "race") {
      demoType = "Race/Ethnicity";
      demoValue = raceVal;
      demographicTypeLabel = "Race";
    } else if (provided[0] === "sex") {
      demoType = "Sex";
      demoValue = sexVal;
      demographicTypeLabel = "Sex";
    } else {
      demoType = "Age Group";     
      demoValue = ageGroupVal;
      demographicTypeLabel = "Age Group";
    }

    console.log("Using demoType/demoValue:", demoType, demoValue);

    // 1) deaths for THIS demographic value
    const sqlThisDemo = `
      SELECT
        COALESCE(SUM(f.deaths), 0) AS total
      FROM fact_flu_rsv_covid_deaths f
      JOIN dim_pathogen p
        ON f.pathogen_id = p.pathogen_id
      JOIN dim_mmwr_week w
        ON f.mmwr_week_id = w.mmwr_week_id
      JOIN dim_demographic_group d
        ON f.demographic_group_id = d.demographic_group_id
      WHERE p.pathogen    = $1      -- pathogen
        AND w.year        = $2      -- year
        AND d.demographic_type = $3      -- 'Race/Ethnicity' / 'Sex' / 'Age Group'
        AND d.demographic_value = $4;  -- specific race/sex/ageGroup
    `;

    // 2) deaths for ALL values of this demographic type
    //    (same pathogen + year, but any race/sex/age value of that type)
    const sqlAll = `
      SELECT
        COALESCE(SUM(f.deaths), 0) AS all_total
      FROM fact_flu_rsv_covid_deaths f
      JOIN dim_pathogen p
        ON f.pathogen_id = p.pathogen_id
      JOIN dim_mmwr_week w
        ON f.mmwr_week_id = w.mmwr_week_id
      JOIN dim_demographic_group d
        ON f.demographic_group_id = d.demographic_group_id
      WHERE p.pathogen    = $1
        AND w.year        = $2
        AND d.demographic_type = $3;
    `;

    const paramsTotal = [pathogen, year, demoType, demoValue];
    const paramsAll = [pathogen, year, demoType];

    const [totalRes, allRes] = await Promise.all([
      pool.query(sqlThisDemo, paramsTotal),
      pool.query(sqlAll, paramsAll),
    ]);

    console.log("totalRes:", totalRes.rows);
    console.log("allRes:", allRes.rows);

    const totalDeaths = Number(totalRes.rows[0]?.total) || 0;
    const sumOfTotalDeaths = Number(allRes.rows[0]?.all_total) || 0;
    const percentDeaths = sumOfTotalDeaths
      ? (totalDeaths / sumOfTotalDeaths) * 100
      : 0;

    res.json({
      pathogen,
      year: Number(year),
      race: raceVal,
      sex: sexVal,
      ageGroup: ageGroupVal,
      demographicType: demographicTypeLabel,
      demographicValue: demoValue,
      totalDeaths,
      sumOfTotalDeaths,
      percentDeaths,
    });
  } catch (err) {
    console.error("Error in /api/deaths-by-pathogen-demographic:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
/**
 * GET /api/estimated-demographic-cases
 * 
 * Estimates the number of cases for a specific demographic group in a state/year/disease
 * by proportionally distributing total cases based on population share.
 * Uses the 3NF normalized NNDSS tables (fact_nndss_weekly) for case data.
 * 
 * Calculation: estimatedCases = (demo_population / total_state_demo_population) * total_yearly_cases
 * 
 * @param {string} stateName - Full state name (required)
 * @param {string} diseaseName - Disease name (required)
 * @param {number} year - Year to analyze (required)
 * @param {string} race - Race/ethnicity category (required)
 * @param {string} sex - Sex category (required)
 * @param {string} ageGroup - Age group category (required)
 * 
 * @returns {Object} Estimated case statistics:
 *   - stateName, stateCode, diseaseName, year, popYear, race, sex, ageGroup
 *   - population: Demographic group population
 *   - totalYearlyCases: Total cases for state/disease/year
 *   - estimatedDemographicCases: Estimated cases for the demographic group
 *   - casesPer100k: Estimated cases per 100,000 population
 * 
 * @example
 * GET /api/estimated-demographic-cases?stateName=California&diseaseName=COVID-19&year=2023&race=White&sex=Male&ageGroup=18-64
 */
const getEstimatedDemographicCases = async (req, res) => {
  try {
    const { stateName, diseaseName, year, race, sex, ageGroup } = req.query;

    if (!stateName || !diseaseName || !year || !race || !sex || !ageGroup) {
      return res.status(400).json({ error: 'Missing required query params.' });
    }

    const caseYear = Number(year);
    if (Number.isNaN(caseYear)) {
      return res.status(400).json({ error: 'Year must be a number' });
    }

    // Population only up to 2023
    const popYear = caseYear === 2024 ? 2023 : caseYear;

    const sql = `
      WITH demo_pop AS (
        -- Population for the specific demographic cell in the state / popYear
        SELECT
          p.population::FLOAT AS population,
          r.state_code
        FROM fact_population_state_demo_year p
        JOIN dim_region r
          ON p.region_id = r.region_id
        WHERE r.state_name = $1               -- stateName
          AND p.year       = $2               -- popYear
          AND p.race       = $4
          AND p.sex        = $5
          AND p.age_group  = $6
      ),
      state_pop AS (
        -- Total state population in that popYear (sum over all demos)
        SELECT
          SUM(p.population)::FLOAT AS total_state_population
        FROM fact_population_state_demo_year p
        JOIN dim_region r
          ON p.region_id = r.region_id
        WHERE r.state_name = $1
          AND p.year       = $2
      ),
      state_cases AS (
        -- Total yearly cases for the state/disease/caseYear from NNDSS (3NF)
        SELECT
          COALESCE(SUM(f.current_week), 0)::FLOAT AS total_yearly_cases
        FROM fact_nndss_weekly f
        JOIN dim_region_ndss r_ndss
          ON f.region_id = r_ndss.region_id
        JOIN dim_region r
          ON UPPER(r_ndss.reporting_area) = UPPER(r.state_name)
        JOIN dim_disease d
          ON f.disease_id = d.disease_id
        WHERE r.state_name        = $1       -- stateName, via dim_region
          AND d.disease_name      = $3       -- diseaseName
          AND f.current_mmwr_year = $7       -- caseYear
      )
      SELECT
        dp.population,
        dp.state_code,
        sp.total_state_population,
        sc.total_yearly_cases,
        CASE
          WHEN sp.total_state_population > 0
          THEN (dp.population / sp.total_state_population) * sc.total_yearly_cases
          ELSE 0
        END AS estimated_demographic_cases,
        CASE
          WHEN dp.population > 0 AND sp.total_state_population > 0
          THEN ((dp.population / sp.total_state_population)
                * sc.total_yearly_cases
                / dp.population) * 100000
          ELSE 0
        END AS cases_per_100k
      FROM demo_pop  dp
      CROSS JOIN state_pop   sp
      CROSS JOIN state_cases sc;
    `;

    // $1 = stateName
    // $2 = popYear
    // $3 = diseaseName
    // $4 = race
    // $5 = sex
    // $6 = ageGroup
    // $7 = caseYear
    const result = await pool.query(sql, [
      stateName,
      popYear,
      diseaseName,
      race,
      sex,
      ageGroup,
      caseYear,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'No matching demographic population found.' });
    }

    const row = result.rows[0];

    const population = Number(row.population) || 0;
    const totalYearlyCases = Number(row.total_yearly_cases) || 0;
    const estimatedDemographicCases =
      Number(row.estimated_demographic_cases) || 0;
    const casesPer100k = Number(row.cases_per_100k) || 0;

    res.json({
      stateName,
      stateCode: row.state_code,
      diseaseName,
      year: caseYear,  // user-requested year
      popYear,
      race,
      sex,
      ageGroup,
      population,
      totalYearlyCases,
      estimatedDemographicCases,
      casesPer100k: Number(casesPer100k.toFixed(2)),
    });
  } catch (err) {
    console.error('Error in /api/estimated-demographic-cases:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// TREND AND OUTLIER ANALYSIS ENDPOINTS
// ============================================================================

/**
 * GET /api/top-states-by-disease
 * 
 * Identifies the top disease (by per-capita rate) for each state in a given year.
 * Returns one disease per state - the one with the highest cases per 100,000.
 * 
 * @param {number} [year=2025] - Year to analyze (defaults to 2025)
 * 
 * @returns {Array<Object>} Array of top disease objects per state:
 *   - stateName: Name of the state
 *   - diseaseName: Top disease for that state
 *   - totalCases: Total cases for the disease
 *   - totalPopulation: State population
 *   - casesPer100k: Cases per 100,000 population
 * 
 * @example
 * GET /api/top-states-by-disease?year=2023
 */
const getTopStatesByDisease = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || 2025;
    
    const sql = `
      WITH state_disease_rates AS (
        SELECT 
          r.state_name AS "stateName",
          d.disease_name AS "diseaseName",
          SUM(f.current_week_cases) AS "totalCases",
          p.population AS "totalPopulation",
          (SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population, 0)) * 100000 AS "casesPer100k",
          ROW_NUMBER() OVER (
            PARTITION BY r.state_name 
            ORDER BY (SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population, 0)) * 100000 DESC NULLS LAST
          ) AS rank
        FROM fact_cases_weekly f
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = LEAST($1, 2023)
        WHERE f.year = $1
        GROUP BY r.state_name, d.disease_name, p.population
      )
      SELECT 
        "stateName", 
        "diseaseName", 
        "totalCases", 
        "totalPopulation", 
        "casesPer100k"
      FROM state_disease_rates
      WHERE rank = 1
      ORDER BY "stateName" ASC;`;
    
    const result = await pool.query(sql, [year]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/top-states-by-disease:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/states-rising-4years
 * 
 * Identifies states with monotonically increasing per-capita disease rates
 * over a 4-year period using SQL window functions for efficient computation.
 * Useful for detecting emerging disease trends.
 * 
 * @param {string} diseaseName - Disease name to analyze (required)
 * @param {number} startYear - First year of the 4-year window (required)
 * @param {number} endYear - Last year of the 4-year window (must be startYear + 3) (required)
 * 
 * @returns {Array<Object>} Array of states with rising trends:
 *   - stateName: Name of the state with increasing rates
 * 
 * @example
 * GET /api/states-rising-4years?diseaseName=COVID-19&startYear=2020&endYear=2023
 */
const getStatesRising4Years = async (req, res) => {
  try {
    const { diseaseName, startYear, endYear } = req.query;
    const y0 = parseInt(startYear, 10);
    const y3 = parseInt(endYear, 10);

    if (!diseaseName || isNaN(y0) || isNaN(y3) || y3 - y0 !== 3) {
      return res.status(400).json({ error: 'Provide diseaseName, startYear, endYear (4-year window)' });
    }

    const sql = `
      WITH per_year AS (
        SELECT
          r.state_name,
          f.year,
          SUM(f.current_week_cases)::NUMERIC / NULLIF(p.population, 0) * 100000 AS rate
        FROM fact_cases_weekly f
        JOIN dim_disease d ON f.disease_id = d.disease_id
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN fact_population_state_year p
          ON p.region_id = r.region_id
         AND p.year = LEAST(f.year, 2023)
        WHERE f.year BETWEEN $1 AND $2
          AND d.disease_name = $3
        GROUP BY r.state_name, f.year, p.population
      ),
      with_lag AS (
        SELECT
          state_name,
          year,
          rate,
          LAG(rate) OVER (PARTITION BY state_name ORDER BY year) AS prev_rate
        FROM per_year
      )
      SELECT
        state_name AS "stateName"
      FROM with_lag
      GROUP BY state_name
      HAVING
        -- ensure we have data for all years in the window
        COUNT(*) = ($2 - $1 + 1)
        -- ensure every year’s rate is > previous year’s rate
        AND BOOL_AND(prev_rate IS NULL OR rate > prev_rate)
      ORDER BY state_name;
    `;

    const q = await pool.query(sql, [y0, y3, diseaseName]);
    res.json(q.rows);
  } catch (err) {
    console.error('Error in /api/states-rising-4years:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/states-high-outliers
 * 
 * Identifies states with per-capita disease rates above the statistical threshold
 * (mean + standard deviation) for a given disease and year.
 * Useful for identifying states requiring immediate attention.
 * 
 * @param {string} diseaseName - Disease name to analyze (required)
 * @param {number} year - Year to analyze (required)
 * 
 * @returns {Array<Object>} Array of outlier states:
 *   - stateName: Name of the outlier state
 *   - perCapita: Per-capita rate for the state
 *   - avgRate: National average rate
 *   - stdRate: Standard deviation of rates
 * 
 * @example
 * GET /api/states-high-outliers?diseaseName=Influenza&year=2023
 */
const getStatesHighOutliers = async (req, res) => {
  try {
    const { diseaseName, year } = req.query;
    const yr = parseInt(year, 10);
    if (!diseaseName || isNaN(yr)) {
      return res.status(400).json({ error: 'diseaseName and year required' });
    }
    const sql = `
      WITH state_stats AS (
        SELECT 
          r.state_name,
          SUM(cw.current_week_cases)::NUMERIC / NULLIF(p.population, 0) * 100000 AS per_capita
        FROM fact_cases_weekly cw
        JOIN dim_region r ON cw.region_id = r.region_id
        JOIN dim_disease d ON cw.disease_id = d.disease_id
        JOIN fact_population_state_year p ON p.region_id = r.region_id AND p.year = LEAST($2, 2023)
        WHERE d.disease_name = $1 AND cw.year = $2
        GROUP BY r.state_name, p.population
      ),
      agg_stats AS (
        SELECT AVG(per_capita) as avg_rate, STDDEV(per_capita) as std_rate
        FROM state_stats
      )
      SELECT 
        s.state_name AS "stateName",
        s.per_capita AS "perCapita",
        a.avg_rate AS "avgRate",
        a.std_rate AS "stdRate"
      FROM state_stats s, agg_stats a
      WHERE s.per_capita > (a.avg_rate + a.std_rate)
      ORDER BY s.per_capita DESC;
    `;
    const q = await pool.query(sql, [diseaseName, yr]);
    
    // The SQL now returns the outlier rows directly with stats included
    const outliers = q.rows.map(row => ({
      stateName: row.stateName,
      perCapita: Number(row.perCapita),
      avgRate: Number(row.avgRate),
      stdRate: Number(row.stdRate)
    }));
    
    res.json(outliers);
  } catch (err) {
    console.error('Error in /api/states-high-outliers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/state-demographic-overunder
 * 
 * Analyzes demographic exposure disparities by comparing each demographic group's
 * share of cases vs. share of population. Uses 3NF normalized NNDSS tables for case data.
 * Positive values indicate over-exposure, negative values indicate under-exposure.
 * 
 * @param {string} stateName - Full state name (required)
 * @param {string} diseaseName - Disease name (required)
 * @param {number} year - Year to analyze (required)
 * 
 * @returns {Array<Object>} Array of demographic group analyses:
 *   - race, sex, ageGroup: Demographic identifiers
 *   - demoCases: Estimated cases for this demographic group (proportional allocation)
 *   - demoPopulation: Population for this demographic group
 *   - shareOfCases: Percentage of total cases
 *   - shareOfPopulation: Percentage of total population
 *   - overUnderExposure: Difference (shareOfCases - shareOfPopulation)
 * 
 * @example
 * GET /api/state-demographic-overunder?stateName=California&diseaseName=COVID-19&year=2023
 */
const getStateDemographicOverUnder = async (req, res) => {
  try {
    const { stateName, diseaseName, year } = req.query;

    if (!stateName || !diseaseName || !year) {
      return res
        .status(400)
        .json({ error: "Missing required query params" });
    }

    const caseYear = parseInt(year, 10);
    if (Number.isNaN(caseYear)) {
      return res
        .status(400)
        .json({ error: "Year must be a number" });
    }

    // Population data only up to 2023 → fall back
    const popYear = caseYear === 2024 ? 2023 : caseYear;

    const sql = `
      -- 1) Total cases in this state/year/disease from NDSS (3NF tables)
      WITH cases_total AS (
        SELECT
          COALESCE(SUM(f.current_week), 0)::NUMERIC AS total_cases
        FROM fact_nndss_weekly f
        JOIN dim_region_ndss r_ndss
          ON f.region_id = r_ndss.region_id
        JOIN dim_region r
          ON UPPER(r_ndss.reporting_area) = UPPER(r.state_name)
        JOIN dim_disease d
          ON f.disease_id = d.disease_id
        WHERE r.state_name        = $1      -- stateName
          AND d.disease_name      = $2      -- diseaseName
          AND f.current_mmwr_year = $3      -- caseYear
      ),

      -- 2) Demographic population breakdown for that state/popYear
      demo_pop AS (
        SELECT
          pop.race,
          pop.sex,
          pop.age_group,
          pop.population::NUMERIC AS demo_population
        FROM fact_population_state_demo_year pop
        JOIN dim_region r
          ON pop.region_id = r.region_id
        WHERE r.state_name = $1
          AND pop.year     = $4             -- popYear
      ),

      -- 3) Total population for normalizing shares
      tot_pop AS (
        SELECT COALESCE(SUM(demo_population), 0) AS total_population
        FROM demo_pop
      )

      -- 4) Allocate total cases to each demographic by population share
      SELECT
        dp.race,
        dp.sex,
        dp.age_group,
        CASE
          WHEN tp.total_population > 0
          THEN dp.demo_population * ct.total_cases / tp.total_population
          ELSE 0
        END AS demo_cases,
        dp.demo_population
      FROM demo_pop dp
      CROSS JOIN tot_pop   tp
      CROSS JOIN cases_total ct;
    `;

    // $1 = stateName
    // $2 = diseaseName
    // $3 = caseYear
    // $4 = popYear
    const q = await pool.query(sql, [stateName, diseaseName, caseYear, popYear]);

    // Even if there are no NDSS rows, demo_pop might still have rows;
    // in that case total_cases = 0, so everything becomes 0 but rows still exist.
    const rows = q.rows || [];

    const totalCases = rows.reduce(
      (sum, r) => sum + Number(r.demo_cases || 0),
      0
    );
    const totalPop = rows.reduce(
      (sum, r) => sum + Number(r.demo_population || 0),
      0
    );

    const response = rows.map((row) => {
      const demoCases = Number(row.demo_cases || 0);
      const pop = Number(row.demo_population || 0);

      const shareCases = totalCases ? demoCases / totalCases : 0;
      const sharePop = totalPop ? pop / totalPop : 0;

      return {
        race: row.race,
        sex: row.sex,
        ageGroup: row.age_group,
        demoCases,
        demoPopulation: pop,
        shareOfCases: Number(shareCases.toFixed(4)),
        shareOfPopulation: Number(sharePop.toFixed(4)),
        overUnderExposure: Number((shareCases - sharePop).toFixed(4)),
      };
    });

    res.json(response);
  } catch (err) {
    console.error("Error in /api/state-demographic-overunder:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/states-below-national-all-races
 * 
 * Identifies states where ALL racial groups have per-capita death rates below
 * their respective national averages. Uses fact_deaths table for death statistics.
 * These are considered "low-risk" states.
 * 
 * @param {string} diseaseName - Disease name to analyze (required)
 * @param {number} year - Year to analyze (required)
 * 
 * @returns {Array<Object>} Array of low-risk states:
 *   - stateName: Name of the state
 * 
 * @example
 * GET /api/states-below-national-all-races?diseaseName=COVID-19&year=2023
 */
const getStatesBelowNationalAllRaces = async (req, res) => {
  try {
    const { diseaseName, year } = req.query;
    const yr = parseInt(year, 10);

    if (!diseaseName || isNaN(yr)) {
      return res.status(400).json({ error: 'diseaseName and year required' });
    }

    const sql = `
      -- 1) National per-capita death rates by demographic cell (race/sex/age_group)
      WITH national_race_rates AS (
    -- 1) National per-capita death rate by race
    SELECT
      fd.race,
      SUM(fd.deaths)::NUMERIC
        / NULLIF(SUM(pop.population), 0) AS natl_rate
    FROM fact_deaths fd
    JOIN fact_population_state_demo_year pop
      ON fd.year      = pop.year
    AND fd.race      = pop.race
    AND fd.sex       = pop.sex
    AND fd.age_group = pop.age_group
    WHERE fd.disease_name = $1
      AND fd.year         = $2
    GROUP BY fd.race
  ),

  state_race_rates AS (
    -- 2) State per-capita death rate by race
    SELECT
      r.state_name,
      fd.race,
      SUM(fd.deaths)::NUMERIC
        / NULLIF(SUM(pop.population), 0) AS state_rate
    FROM fact_deaths fd
    JOIN fact_population_state_demo_year pop
      ON fd.year      = pop.year
    AND fd.race      = pop.race
    AND fd.sex       = pop.sex
    AND fd.age_group = pop.age_group
    AND fd.region_id = pop.region_id        -- adjust if your key is different
    JOIN dim_region r
      ON pop.region_id = r.region_id
    WHERE fd.disease_name = $1
      AND fd.year         = $2
    GROUP BY r.state_name, fd.race
  ),

  state_vs_national AS (
    -- 3) Compare each state's race-specific rate with the national race-specific rate
    SELECT
      s.state_name,
      s.race,
      s.state_rate,
      n.natl_rate,
      CASE
        WHEN s.state_rate < n.natl_rate THEN 1 ELSE 0
      END AS is_below_nat
    FROM state_race_rates s
    JOIN national_race_rates n
      ON s.race = n.race
  )

  -- 4) Keep only states that are below the national rate for EVERY race
  SELECT
    state_name AS "stateName"
  FROM state_vs_national
  GROUP BY state_name
  HAVING MIN(is_below_nat) = 1      -- no race where state_rate >= natl_rate
  ORDER BY state_name;

    `;

    const result = await pool.query(sql, [diseaseName, yr]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/states-below-national-all-races:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

/**
 * GET /api/state-vs-national-trend-weekly
 * Returns weekly per-capita rates for just a specific state for a given disease and year.
 * Input: stateName, diseaseName, year
 * Output: [{ week, stateCasesPer100k }]
 */
const getStateVsNationalTrendWeekly = async (req, res) => {
  try {
    const { stateName, diseaseName } = req.query;
    if (!stateName || !diseaseName) {
      return res.status(400).json({ error: 'stateName and diseaseName required' });
    }
    console.log('[DEBUG] stateName:', stateName, '| diseaseName:', diseaseName);
    const sql = `
        SELECT
            f.year,
            f.week,
            r.state_name,
            d.disease_name,
            SUM(COALESCE(f.current_week_cases, 0)) AS total_cases
        FROM fact_cases_weekly f
        JOIN dim_region r ON f.region_id = r.region_id
        JOIN dim_disease d ON f.disease_id = d.disease_id
        WHERE
            r.state_name = $1
            AND d.disease_name = $2 
        GROUP BY
            f.year,
            f.week,
            r.state_name,
            d.disease_name
        ORDER BY
            f.year, f.week;
    `;
    const result = await pool.query(sql, [stateName, diseaseName]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /api/state-vs-national-trend-weekly:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Module Exports
 * 
 * Exports all route handler functions for use in server.js
 */
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
  getStateVsNationalTrend,
  getStateVsNationalTrendWeekly
};