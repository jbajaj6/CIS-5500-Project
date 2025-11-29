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

export default function App() {
  return (
    <>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />

      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Disease Analysis Routes */}
        <Route path="/state-top-diseases" element={<StateTopDiseases />} />
        <Route path="/weekly-rates" element={<WeeklyRates />} />
        <Route path="/yearly-rates" element={<YearlyRates />} />
        <Route path="/outliers" element={<Outliers />} />
        <Route path="/trend-comparison" element={<TrendComparison />} />

        {/* Demographics Routes */}
        <Route path="/demographic-cases" element={<DemographicCases />} />
        <Route path="/disparity-analysis" element={<DisparityAnalysis />} />
        <Route path="/deaths-analysis" element={<DeathsAnalysis />} />
        <Route path="/low-risk-states" element={<LowRiskStates />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

// 404 Page Component
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
