# API Documentation

Complete API reference for the Disease Analytics Platform backend.

**Base URL**: `http://localhost:3000` (development) or your production server URL

All endpoints return JSON responses. Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

---

## Health Check

### GET /api/health

Simple health check endpoint to verify server is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Basic Data Endpoints

### GET /api/states

Retrieves a list of all states with their codes and names.

**Response:**
```json
[
  {
    "stateCode": "CA",
    "stateName": "California"
  },
  ...
]
```

### GET /api/diseases

Retrieves a list of all diseases/pathogens tracked in the system.

**Response:**
```json
[
  {
    "diseaseId": 1,
    "diseaseName": "COVID-19"
  },
  ...
]
```

### GET /api/demographic-options

Retrieves all available demographic filter options.

**Response:**
```json
{
  "races": ["White", "Black or African American", "Asian", ...],
  "sexes": ["Male", "Female"],
  "ageGroups": ["0-17", "18-64", "65+", ...]
}
```

---

## Case Rate Analysis

### GET /api/state-yearly-percapita

Calculates yearly per-capita disease rates (per 100,000) for all states.

**Query Parameters:**
- `year` (required, integer): Year to analyze
- `diseaseId` (required, integer): Disease ID

**Example:**
```
GET /api/state-yearly-percapita?year=2023&diseaseId=1
```

**Response:**
```json
[
  {
    "stateName": "California",
    "diseaseName": "COVID-19",
    "perCapitaYearlyCases": 1234.56
  },
  ...
]
```

### GET /api/state-weekly-percapita

Calculates weekly per-capita rates and 52-week maximum rates.

**Query Parameters:**
- `year` (required, integer): Year of the week
- `week` (required, integer): Week number (1-52)
- `diseaseIds` (required, string): Comma-separated disease IDs (e.g., "1,2,3")

**Example:**
```
GET /api/state-weekly-percapita?year=2023&week=25&diseaseIds=1,2,3
```

**Response:**
```json
[
  {
    "state_name": "California",
    "disease_name": "COVID-19",
    "perCapitaWeeklyCases": 45.67,
    "perCapita52WeekMax": 89.12
  },
  ...
]
```

---

## Demographic Analysis

### GET /api/estimated-demographic-cases

Estimates case counts for a specific demographic group using proportional distribution.

**Query Parameters:**
- `stateName` (required, string): Full state name
- `diseaseName` (required, string): Disease name
- `year` (required, integer): Year to analyze
- `race` (required, string): Race/ethnicity category
- `sex` (required, string): Sex category
- `ageGroup` (required, string): Age group category

**Example:**
```
GET /api/estimated-demographic-cases?stateName=California&diseaseName=COVID-19&year=2023&race=White&sex=Male&ageGroup=18-64
```

**Response:**
```json
{
  "stateName": "California",
  "stateCode": "CA",
  "diseaseName": "COVID-19",
  "year": 2023,
  "race": "White",
  "sex": "Male",
  "ageGroup": "18-64",
  "population": 8500000,
  "totalYearlyCases": 500000,
  "estimatedDemographicCases": 250000,
  "casesPer100k": 2941.18
}
```

### GET /api/deaths-by-pathogen-demographic

Calculates death statistics for a pathogen and demographic group.

**Query Parameters:**
- `pathogen` (required, string): Disease/pathogen name
- `yearStart` (required, integer): Start year
- `yearEnd` (required, integer): End year
- `monthStart` (required, integer): Start month (1-12)
- `monthEnd` (required, integer): End month (1-12)
- `demographicType` (required, string): "Age Group", "Sex", or "Race/Hispanic"
- `demographicValue` (required, string): Specific demographic value

**Example:**
```
GET /api/deaths-by-pathogen-demographic?pathogen=COVID-19&yearStart=2020&yearEnd=2023&monthStart=1&monthEnd=12&demographicType=Age Group&demographicValue=65+
```

**Response:**
```json
{
  "pathogen": "COVID-19",
  "totalDeaths": 50000,
  "sumOfTotalDeaths": 100000,
  "percentDeaths": 50.0
}
```

### GET /api/state-demographic-overunder

Analyzes demographic exposure disparities (over/under-exposure).

**Query Parameters:**
- `stateName` (required, string): Full state name
- `diseaseName` (required, string): Disease name
- `year` (required, integer): Year to analyze

**Example:**
```
GET /api/state-demographic-overunder?stateName=California&diseaseName=COVID-19&year=2023
```

**Response:**
```json
[
  {
    "race": "White",
    "sex": "Male",
    "ageGroup": "18-64",
    "demoCases": 50000,
    "demoPopulation": 8500000,
    "shareOfCases": 0.2500,
    "shareOfPopulation": 0.3000,
    "overUnderExposure": -0.0500
  },
  ...
]
```

---

## Trend and Outlier Analysis

### GET /api/top-states-by-disease

Identifies the top disease (by per-capita rate) for each state.

**Query Parameters:**
- `year` (optional, integer, default: 2025): Year to analyze

**Example:**
```
GET /api/top-states-by-disease?year=2023
```

**Response:**
```json
[
  {
    "stateName": "California",
    "diseaseName": "COVID-19",
    "totalCases": 500000,
    "totalPopulation": 40000000,
    "casesPer100k": 1250.0
  },
  ...
]
```

### GET /api/states-rising-4years

Identifies states with monotonically increasing rates over 4 years.

**Query Parameters:**
- `diseaseName` (required, string): Disease name
- `startYear` (required, integer): First year (must be 4 years before endYear)
- `endYear` (required, integer): Last year (must be startYear + 3)

**Example:**
```
GET /api/states-rising-4years?diseaseName=COVID-19&startYear=2020&endYear=2023
```

**Response:**
```json
[
  {
    "stateName": "Texas"
  },
  ...
]
```

### GET /api/states-high-outliers

Identifies states with rates above mean + standard deviation.

**Query Parameters:**
- `diseaseName` (required, string): Disease name
- `year` (required, integer): Year to analyze

**Example:**
```
GET /api/states-high-outliers?diseaseName=Influenza&year=2023
```

**Response:**
```json
[
  {
    "stateName": "Florida",
    "perCapita": 125.5,
    "avgRate": 75.2,
    "stdRate": 30.1
  },
  ...
]
```

### GET /api/states-below-national-all-races

Identifies states where all racial groups are below national averages.

**Query Parameters:**
- `diseaseName` (required, string): Disease name
- `year` (required, integer): Year to analyze

**Example:**
```
GET /api/states-below-national-all-races?diseaseName=COVID-19&year=2023
```

**Response:**
```json
[
  {
    "stateName": "Vermont"
  },
  ...
]
```

### GET /api/state-vs-national-trend

Compares state-level and national-level rates over a year range.

**Query Parameters:**
- `diseaseName` (required, string): Disease name
- `stateName` (required, string): Full state name
- `startYear` (required, integer): First year
- `endYear` (required, integer): Last year (must be >= startYear)

**Example:**
```
GET /api/state-vs-national-trend?diseaseName=COVID-19&stateName=California&startYear=2020&endYear=2023
```

**Response:**
```json
[
  {
    "year": 2020,
    "stateCasesPer100k": 1234.56,
    "nationalCasesPer100k": 987.65
  },
  {
    "year": 2021,
    "stateCasesPer100k": 2345.67,
    "nationalCasesPer100k": 1876.54
  },
  ...
]
```

---

## Legacy Endpoint

### GET /disease

Legacy paginated endpoint for disease-state case data.

**Query Parameters:**
- `page` (optional, integer, default: 1): Page number
- `page_size` (optional, integer, default: 10): Results per page

**Example:**
```
GET /disease?page=1&page_size=20
```

**Response:**
```json
[
  {
    "disease_name": "COVID-19",
    "state_name": "California",
    "total_cases": 500000,
    "per_capita_rate": 0.0125
  },
  ...
]
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK**: Successful request
- **400 Bad Request**: Invalid parameters or missing required parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error (check server logs)

Error responses include a descriptive message:
```json
{
  "error": "year and diseaseId must be integers"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting for production use.

---

## CORS

CORS is configured to allow all origins (`origin: '*'`). For production, restrict this to specific domains.

---

## Notes

- All per-capita rates are calculated per 100,000 population
- Population data defaults to 2023 when year exceeds available data
- Date ranges are inclusive (start and end values included)
- Demographic values must match exactly (case-sensitive in some cases)
- State names should be full names (e.g., "California" not "CA")

