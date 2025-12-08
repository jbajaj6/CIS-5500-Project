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
const routes = require('./routes'); 

// Initialize Express application
const app = express();

// Middleware Configuration
// CORS: Allow cross-origin requests (configure appropriately for production)
app.use(cors({ origin: '*' }));

// JSON Parser: Parse JSON request bodies
app.use(express.json());

/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify the server is running and responsive.
 * Useful for monitoring and load balancer health checks.
 * 
 * @route GET /api/health
 * @returns {Object} 200 - Server status object
 * @returns {string} status - Status message ("ok")
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * API Route Registrations
 * 
 * All API endpoints are registered here. Routes are organized by functionality:
 * - Basic data endpoints (states, diseases)
 * - Analysis endpoints (per-capita rates, trends, outliers)
 * - Demographic analysis endpoints
 * 
 * See routes.js for detailed endpoint documentation.
 */
app.get('/disease', routes.disease);
app.get('/api/states', routes.getStates);
app.get('/api/diseases', routes.getDiseases);
app.get('/api/state-yearly-percapita', routes.getStateYearlyPercapita);
app.get('/api/state-weekly-percapita', routes.getStateWeeklyPercapita);
app.get('/api/demographic-options', routes.getDemographicOptions);
app.get('/api/deaths-by-pathogen-demographic', routes.getDeathsByPathogenDemographic);
app.get('/api/estimated-demographic-cases', routes.getEstimatedDemographicCases);
app.get('/api/top-states-by-disease', routes.getTopStatesByDisease);
app.get('/api/states-rising-4years', routes.getStatesRising4Years);
app.get('/api/states-high-outliers', routes.getStatesHighOutliers);
app.get('/api/state-demographic-overunder', routes.getStateDemographicOverUnder);
app.get('/api/states-below-national-all-races', routes.getStatesBelowNationalAllRaces);
app.get('/api/state-vs-national-trend', routes.getStateVsNationalTrend);

/**
 * Start Server
 * 
 * Binds the Express application to the configured port and starts listening
 * for incoming HTTP requests.
 * 
 * @param {number} config.server_port - Port number from config.json
 */
app.listen(config.server_port, () => {
  console.log(`Server listening on port ${config.server_port}`);
});

module.exports = app;