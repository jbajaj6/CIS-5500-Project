require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config.json');
const routes = require('./routes'); 

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route Registrations
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

app.listen(config.server_port, () => {
  console.log(`Server listening on port ${config.server_port}`);
});

module.exports = app;