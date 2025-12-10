/**
 * Main Application Component
 * 
 * This is the root component of the Disease Analytics Platform frontend.
 * It sets up client-side routing using React Router and renders the navigation
 * bar and page components based on the current route.
 * 
 * The application is organized into two main categories:
 * 1. Disease Analysis: State-level disease tracking and trend analysis
 * 2. Demographics: Population-level analyses and health disparities
 * 
 * @module App
 * @requires react-router-dom
 * @requires @mui/material
 */

// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";

import NavBar from "./components/NavBar.jsx";
import HomePage from "./pages/HomePage.jsx";
import StateTopDiseases from "./pages/StateTopDiseases.jsx";
import WeeklyRates from "./pages/WeeklyRates.jsx";
import YearlyRates from "./pages/YearlyRates.jsx";
import Outliers from "./pages/Outliers.jsx";
import TrendComparison from "./pages/TrendComparison.jsx";
import DemographicCases from "./pages/DemographicCases.jsx";
import DisparityAnalysis from "./pages/DisparityAnalysis.jsx";
import DeathsAnalysis from "./pages/DeathsAnalysis.jsx";
import LowRiskStates from "./pages/LowRiskStates.jsx";
import StateDeathsEstimate from "./pages/EstimatedStateDeaths.jsx" 

/**
 * App Component
 * 
 * Main application component that sets up routing and renders the application shell.
 * Uses React Router for client-side navigation and Material-UI's CssBaseline
 * for consistent styling across browsers.
 * 
 * @returns {JSX.Element} The application root element
 */
export default function App() {
  return (
    <>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />

      <Routes>
        {/* Home Page - Landing page with feature overview */}
        <Route path="/" element={<HomePage />} />

        {/* Disease Analysis Routes - State-level disease tracking and trends */}
        <Route path="/state-top-diseases" element={<StateTopDiseases />} />
        <Route path="/weekly-rates" element={<WeeklyRates />} />
        <Route path="/yearly-rates" element={<YearlyRates />} />
        <Route path="/outliers" element={<Outliers />} />
        <Route path="/trend-comparison" element={<TrendComparison />} />

        {/* Demographics Routes - Population-level analyses and disparities */}
        <Route path="/demographic-cases" element={<DemographicCases />} />
        <Route path="/disparity-analysis" element={<DisparityAnalysis />} />
        <Route path="/deaths-analysis" element={<DeathsAnalysis />} />
        <Route path="/low-risk-states" element={<LowRiskStates />} />
        <Route path="/estimated-state-deaths" element={<StateDeathsEstimate />} />

        {/* 404 Fallback - Catch-all route for undefined paths */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

/**
 * 404 Not Found Component
 * 
 * Renders a user-friendly error page when a route doesn't exist.
 * Provides a link back to the home page for easy navigation.
 * 
 * @returns {JSX.Element} 404 error page
 */
function NotFound() {
  return (
    <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>🔍</div>
      <h1 style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>404 - Page Not Found</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
        The page you're looking for doesn't exist.
      </p>
      <a href="/" style={{ textDecoration: 'none' }}>
        <button className="btn-primary">Return to Dashboard</button>
      </a>
    </div>
  );
}
