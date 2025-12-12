/**
 * Disease Analytics Platform - Express Server
 *
 * Main server file that sets up the Express application, configures middleware,
 * and registers all API routes. The server connects to a PostgreSQL database
 * and provides RESTful endpoints for disease surveillance data analysis.
 *
 * @module server
 * @requires express
 * @requires cors
 * @requires dotenv
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config.json');
require("dotenv").config();


// --- Explicitly Import ALL Route Handlers ---

// This import is now redundant but kept for history/apiRouter usage if needed
// const apiRouter = require('./routes'); 

// Initialize Express application
const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: '*' }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
/**
 * Health Check Endpoint
 *
 * @route GET /api/health
 * @returns {Object} 200 - { status: "ok" }
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

// COMMENT OUT THE OLD AGGREGATED ROUTES OBJECT TO AVOID CONFUSION
// const routes = require('./routes'); 

// Explicitly import each handler directly from its file path.
// Note: Handlers like 'disease' and 'getDiseases' must be destructured if
// their file uses 'module.exports = { disease }', otherwise use direct require.
// Based on your previous code, we assume files like states.js export directly,
// but disease.js exports an object, so we handle both cases.

//const { disease } = require('./routes/disease');

const getStates = require('./routes/states');
const getDiseases = require('./routes/getDiseases');
const getStateYearlyPercapita = require('./routes/getStateYearlyPercapita');
const getStateWeeklyPercapita = require('./routes/getStateWeeklyPercapita');
const getDemographicOptions = require('./routes/getDemographicOptions');
const getDeathsByPathogenDemographic = require('./routes/getDeathsByPathogenDemographic');
const getEstimatedDemographicCases = require('./routes/getEstimatedDemographicCases');
const getTopStatesByDisease = require('./routes/getTopStatesByDisease');
const getStatesRising4Years = require('./routes/getStatesRising4Years');
const getStatesHighOutliers = require('./routes/getStatesHighOutliers');
const getStateDemographicOverUnder = require('./routes/getStateDemographicOverUnder');
const getStatesBelowNationalAllRaces = require('./routes/getStatesBelowNationalAllRaces');
const getStateVsNationalTrend = require('./routes/getStateVsNationalTrend');
const getStateVsNationalTrendWeekly = require('./routes/getStateVsNationalTrendWeekly');
const getEstimatedDeathsByState = require('./routes/getEstimatedDeathsByState');
const getSimilarSymptoms = require('./routes/getSymptoms')


// Use the explicitly imported functions for all routes
//app.get('/disease', disease);
app.get('/api/states', getStates);
app.get('/api/diseases', getDiseases);
app.get('/api/state-yearly-percapita', getStateYearlyPercapita);
app.get('/api/state-weekly-percapita', getStateWeeklyPercapita);
app.get('/api/demographic-options', getDemographicOptions);
app.get('/api/deaths-by-pathogen-demographic', getDeathsByPathogenDemographic);
app.get('/api/estimated-demographic-cases', getEstimatedDemographicCases);
app.get('/api/top-states-by-disease', getTopStatesByDisease);
app.get('/api/states-rising-4years', getStatesRising4Years);
app.get('/api/states-high-outliers', getStatesHighOutliers);
app.get('/api/state-demographic-overunder', getStateDemographicOverUnder);
app.get('/api/states-below-national-all-races', getStatesBelowNationalAllRaces);
app.get('/api/state-vs-national-trend', getStateVsNationalTrend);
app.get('/api/state-vs-national-trend-weekly', getStateVsNationalTrendWeekly);
app.get('/api/estimated-deaths-by-state', getEstimatedDeathsByState);
app.get('/api/similar-symptoms', getSimilarSymptoms);


// If you still want the old `/disease` endpoint (not `/api/...`),
// you can mount it via its own router or handler, e.g.:
// const { disease } = require('./routes/diseaseHandler');
// app.get('/disease', disease);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
if (require.main === module) {
  app.listen(config.server_port, () => {
    console.log(`Server listening on port ${config.server_port}`);
  });
}

module.exports = app;