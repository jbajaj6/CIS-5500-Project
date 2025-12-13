const { pool } = require('../db');


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
              "Missing pathogen and year.",
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
          .json({ error: "You must provide one type" });
      }
      if (provided.length > 1) {
        return res
          .status(400)
          .json({ error: "You must provide one type" });
      }
  
      let demoType;
      let demoValue;
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
        WHERE p.pathogen    = $1
          AND w.year        = $2
          AND d.demographic_type = $3
          AND d.demographic_value = $4;
      `;

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

  module.exports = getDeathsByPathogenDemographic;