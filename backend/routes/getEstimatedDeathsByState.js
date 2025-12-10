const {pool} = req('../db');

/**
 * GET /api/estimated-deaths-by-state
 * 
 * Calculates estimated number of deaths for flu, rsv, or covid in a given state in a given year
 * based on comparing demographic death data to state demographic data
 * 
 * @param {string} pathogen - Disease/pathogen name (required)
 * @param {number} year - Year to analyze (required)
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
 * GET /api/estimated-deaths-by-state?pathogen=COVID-19&year=2023
 */
const getEstimatedDeathsByState = async (req, res) => {
    try {
      const { pathogen, year, state } = req.query;
      console.log('Incoming query:', req.query);
  
      // pathogen + year are always required
      if (!pathogen || !year || !state ) {
        return res
          .status(400)
          .json({ error: 'Missing required query params: pathogen, state, and year are required.' });
      }
  
      //can def get rid of the join with mmwr_week
  
      const stateEstimate = `
              WITH age_group_deaths AS (
                  SELECT 
                      d.demographic_value AS age_group,
                      COALESCE(SUM(f.deaths), 0) AS total_deaths
                  FROM fact_flu_rsv_covid_deaths f
                  JOIN dim_pathogen p ON f.pathogen_id = p.pathogen_id
                  JOIN dim_mmwr_week w ON f.mmwr_week_id = w.mmwr_week_id
                  JOIN dim_demographic_group d ON f.demographic_group_id = d.demographic_group_id
                  WHERE p.pathogen = $1
                      AND w.year = $2
                      AND d.demographic_type = 'Age Group'
                  GROUP BY d.demographic_value
              ),
              national_population AS (
                  SELECT 
                      CASE 
                          WHEN f.age_group = '0' THEN '0-17 years'
                          WHEN f.age_group LIKE '%+' THEN '65+ years'  -- handles "90+", "85+", etc.
                          WHEN CAST(SPLIT_PART(f.age_group, '-', 1) AS INTEGER) < 18 THEN '0-17 years'
                          WHEN CAST(SPLIT_PART(f.age_group, '-', 1) AS INTEGER) >= 18 
                          AND CAST(SPLIT_PART(f.age_group, '-', 1) AS INTEGER) < 65 THEN '18-64 years'
                          WHEN CAST(SPLIT_PART(f.age_group, '-', 1) AS INTEGER) >= 65 THEN '65+ years'
                      END AS age_group,
                      SUM(f.population) AS total_population
                  FROM fact_population_state_demo_year f
                  WHERE f.year = $2
                  GROUP BY age_group
              ),
              state_population_grouped AS (
                  SELECT 
                      CASE 
                          WHEN f.age_group = '0' THEN '0-17 years'
                          WHEN f.age_group LIKE '%+' THEN '65+ years'  -- handles "90+", "85+", etc.
                          WHEN CAST(SPLIT_PART(f.age_group, '-', 1) AS INTEGER) < 18 THEN '0-17 years'
                          WHEN CAST(SPLIT_PART(f.age_group, '-', 1) AS INTEGER) >= 18 
                          AND CAST(SPLIT_PART(f.age_group, '-', 1) AS INTEGER) < 65 THEN '18-64 years'
                          WHEN CAST(SPLIT_PART(f.age_group, '-', 1) AS INTEGER) >= 65 THEN '65+ years'
                      END AS age_group,
                      SUM(f.population) AS state_population
                  FROM fact_population_state_demo_year f
                  JOIN dim_region r ON f.region_id = r.region_id
                  WHERE r.state_name = $3
                      AND f.year = $2
                  GROUP BY age_group
              ),
              death_rates AS (
                  SELECT 
                      a.age_group,
                      a.total_deaths,
                      n.total_population,
                      a.total_deaths / NULLIF(n.total_population, 0) AS death_rate
                  FROM age_group_deaths a
                  JOIN national_population n ON a.age_group = n.age_group
              )
              SELECT 
                  SUM(s.state_population * d.death_rate) AS estimated_deaths
              FROM state_population_grouped s
              JOIN death_rates d ON s.age_group = d.age_group
          `;
  
      const result = await pool.query(stateEstimate, [pathogen, year, state]);
      
      res.json({
          state,
          year,
          pathogen,
          estimated_deaths: Math.round(result.rows[0]?.estimated_deaths || 0)
      });
    } catch (err) {
      console.error('Error in /api/estimated-deaths-by-state:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  module.exports = getEstimatedDeathsByState;