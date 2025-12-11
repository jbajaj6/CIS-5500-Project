# Disease Analytics Platform

**Deployment:** [https://cis-5500-project.vercel.app/](https://cis-5500-project.vercel.app/)

A comprehensive web application for analyzing epidemiological data, tracking disease trends, and identifying health disparities across the United States. This platform provides interactive visualizations and analytical tools for exploring disease surveillance data from multiple sources.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Optimization](#optimization)

## Overview

The Disease Analytics Platform is a full-stack application that enables users to:

- Analyze disease case rates at state and national levels
- Track weekly and yearly trends across multiple diseases
- Identify statistical outliers and rising trends
- Examine demographic disparities in disease burden
- Compare state-level data against national averages
- Estimate demographic-specific case counts

The platform integrates data from CDC NNDSS (National Notifiable Diseases Surveillance System), population demographics, and death statistics to provide comprehensive epidemiological insights.

## Features

### Disease Analysis
- **State Top Diseases**: Identify the leading disease by per-capita rate for each state
- **Weekly Case Rates**: Analyze weekly per-capita rates with 52-week maximum comparisons
- **Yearly Case Rates**: Compare annual disease rates across states
- **Statistical Outliers**: Detect states with unusually high disease rates (above mean + standard deviation)
- **State vs National Trends**: Compare state-level trends against national averages over time

### Demographics Analysis
- **Demographic Cases**: Estimate case counts for specific demographic groups (race, sex, age)
- **Disparity Analysis**: Calculate over/under-exposure of demographic groups to diseases
- **Deaths by Demographics**: Analyze death statistics by demographic characteristics
- **Low Risk States**: Identify states with below-average rates across all racial groups

## Architecture

The application follows a client-server architecture:

```
┌─────────────────┐
│   Frontend      │  React/Preact + Material-UI
│   (Port 5173)   │  Vite build tool
└────────┬────────┘
         │ HTTP/REST API
┌────────▼────────┐
│   Backend       │  Express.js
│   (Port 3000)   │  Node.js
└────────┬────────┘
         │ PostgreSQL
┌────────▼────────┐
│   Database      │  AWS RDS PostgreSQL
│   (PostgreSQL)  │  Star Schema (Fact/Dimension tables)
└─────────────────┘
```

### Database Schema

The database uses a star schema design with:

- **Fact Tables**:
  - `fact_cases_weekly`: Weekly disease case counts by state and disease
  - `fact_population_state_year`: Annual state population data
  - `fact_population_state_demo_year`: Demographic population breakdowns
  - `fact_deaths`: Death statistics by disease and demographics

- **Dimension Tables**:
  - `dim_region`: State/region information
  - `dim_disease`: Disease/pathogen information

## Tech Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Database (via `pg` driver)
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Frontend
- **Preact/React**: UI framework
- **Material-UI (MUI)**: Component library
- **React Router**: Client-side routing
- **Recharts**: Data visualization
- **Vite**: Build tool and dev server

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to PostgreSQL database (AWS RDS configured)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
DB_HOST=your-database-host
DB_PORT=5432
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
```

**Note**: The project also uses `config.json` for RDS connection. Ensure either `.env` or `config.json` is properly configured.

4. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000` (or the port specified in `config.json`).

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `frontend` directory (optional):
```env
VITE_API_BASE_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (default Vite port).

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Project Structure

```
CIS-5500-Project/
├── backend/
│   ├── server.js          # Express server setup and route registration
│   ├── routes.js           # Main API route handlers
│   ├── routes2.js          # Alternative route definitions (reference)
│   ├── db.js               # Database connection pool
│   ├── config.json         # Database and server configuration
│   ├── check-*.js          # Data validation scripts
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables (create this)
│
├── frontend/
│   ├── src/
│   │   ├── app.jsx         # Main app component with routing
│   │   ├── main.jsx        # Application entry point
│   │   ├── config.js       # API configuration
│   │   ├── components/     # Reusable UI components
│   │   │   ├── NavBar.jsx
│   │   │   ├── FilterPanel.jsx
│   │   │   ├── DataCard.jsx
│   │   │   ├── StatsGrid.jsx
│   │   │   └── LazyTable.jsx
│   │   └── pages/          # Page components
│   │       ├── HomePage.jsx
│   │       ├── StateTopDiseases.jsx
│   │       ├── WeeklyRates.jsx
│   │       ├── YearlyRates.jsx
│   │       ├── Outliers.jsx
│   │       ├── TrendComparison.jsx
│   │       ├── DemographicCases.jsx
│   │       ├── DisparityAnalysis.jsx
│   │       ├── DeathsAnalysis.jsx
│   │       └── LowRiskStates.jsx
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
│
└── README.md               # This file
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoint documentation.

### Quick Reference

**Health Check:**
- `GET /api/health` - Server health status

**Data Endpoints:**
- `GET /api/states` - List all states
- `GET /api/diseases` - List all diseases
- `GET /api/state-yearly-percapita` - Yearly per-capita rates by state
- `GET /api/state-weekly-percapita` - Weekly per-capita rates with 52-week max
- `GET /api/demographic-options` - Available demographic filter options
- `GET /api/estimated-demographic-cases` - Estimated cases by demographics
- `GET /api/top-states-by-disease` - Top states by disease rate
- `GET /api/states-rising-4years` - States with 4-year increasing trends
- `GET /api/states-high-outliers` - States above statistical threshold
- `GET /api/state-demographic-overunder` - Demographic exposure analysis
- `GET /api/states-below-national-all-races` - Low-risk states
- `GET /api/state-vs-national-trend` - State vs national comparison

## Development

### Running in Development Mode

1. Start the backend server:
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

2. Start the frontend dev server:
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Code Style

- Backend: Standard JavaScript (ES6+)
- Frontend: JSX with Preact/React
- Use meaningful variable names
- Add JSDoc comments for complex functions
- Follow existing code patterns

### Testing

Data validation scripts are available in the `backend/` directory:
- `check-overlap.js` - Check data overlap
- `check-population.js` - Validate population data
- `check-years.js` - Validate year ranges

## Security Notes

- Database credentials should be stored in `.env` files (not committed to version control)
- The `config.json` file contains sensitive data and should be excluded from public repositories
- CORS is currently configured to allow all origins (`origin: '*'`) - restrict in production

## License

This project is part of a CIS 5500 course project.

## Optimization

To ensure scalability and performance, the application employs several optimization techniques:

### Query Performance Optimization Case Study

We encountered significant performance bottlenecks with our initial "naive" SQL implementations, particularly for complex analytical queries involving multi-year trends and statistical outlier detection. We successfully optimized these queries to achieve a **300x to 1500x performance improvement**.

#### 1. Trend Analysis (States Rising for 4 Consecutive Years)

**The Problem:**
Our original query used a "row-by-row" logic, utilizing nested subqueries to calculate rates for each subsequent year. This forced the database to re-scan the `fact_cases_weekly` table multiple times for every single state, resulting in a **45+ second execution time**.

**Original Implementation (Unoptimized - ~45s):**
```sql
-- "Naive" approach: Nested subqueries for every year comparison
SELECT DISTINCT r.state_name
FROM dim_region r
JOIN fact_cases_weekly f1 ON r.region_id = f1.region_id
WHERE ...
  AND (
      -- Subquery for Year 1
      (SELECT SUM(cases)/pop FROM fact_cases_weekly WHERE year = f1.year)
      <
      -- Subquery for Year 2 (Dependent/Correlated)
      (SELECT SUM(cases)/pop FROM fact_cases_weekly WHERE year = f1.year + 1)
  )
  AND ( ... Year 2 < Year 3 ... )
  AND ( ... Year 3 < Year 4 ... )
```

**Optimized Solution (~140ms):**
We refactored this to use **Window Functions** (`LAG` and `LEAD`) and **Common Table Expressions (CTEs)**. This allowed us to scan the table only once, calculate the year-over-year changes in a single pass, and then filter the results.

#### 2. Statistical Outliers (High Anomaly Detection)

**The Problem:**
detecting states with case rates > (Mean + StdDev). The original query recalculated the global Mean and Standard Deviation for *every single group* (State) in the `HAVING` clause.

**Original Implementation (Unoptimized - ~45s):**
```sql
SELECT state_name, SUM(cases)/pop as rate
FROM fact_cases_weekly
GROUP BY state_name
HAVING rate > (
    -- Re-calculating Global Average for EVERY state group
    (SELECT AVG(rate) FROM (SELECT SUM(cases)/pop FROM fact_cases_weekly GROUP BY state) a)
    +
    -- Re-calculating Global StdDev for EVERY state group
    (SELECT STDDEV(rate) FROM (SELECT SUM(cases)/pop FROM fact_cases_weekly GROUP BY state) b)
)
```

**Optimized Solution (~30ms):**
We used a **CTE** to calculate the global statistics (Mean and StdDev) *once* upfront. We then cross-joined this single row of statistics with the state-level aggregations, allowing for a strictly set-based filtering operation.

### Performance Benchmarks

| Query | Original Time (Unoptimized) | Current Time (Optimized) | Improvement |
|:---|:---:|:---:|:---:|
| **States Rising 4 Years** | ~45,200 ms | ~140 ms | **320x Faster** |
| **States High Outliers** | ~45,200 ms | ~30 ms | **1500x Faster** |
*   **Common Table Expressions (CTEs)**: Used extensively (`WITH ...`) to pre-aggregate data before joining huge fact tables, reducing the size of intermediate results.
*   **Window Functions**: `LAG()` and `MAX() OVER()` are used for trend analysis and 52-week peak calculations, avoiding expensive self-joins (O(n) vs O(n^2) complexity).
*   **Database-Side Math**: Statistical calculations (AVG, STDDEV) are offloaded to the database engine rather than transferring all rows to the application layer.
*   **Pagination**: All large datasets employ server-side pagination to minimize data transfer.

## Contributing

This is an academic project. For questions or issues, please contact the project maintainers.

---

**Last Updated**: 2025
