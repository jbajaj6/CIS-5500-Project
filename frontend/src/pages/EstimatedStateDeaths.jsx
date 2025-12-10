// src/pages/StateDeathsEstimate.jsx
import { useState } from 'react';
import config from '../config';
import { safeFetch, formatNumber } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function StateDeathsEstimate() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [pathogen, setPathogen] = useState('COVID-19');
  const [state, setState] = useState('');

  // US state names
const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 
    'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const loadData = async (
    filterValues = filters,
    currentPathogen = pathogen,
    currentState = state
  ) => {
    const year = filterValues.year;

    if (!year || !currentState) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        state: currentState,
        year: String(year),
        pathogen: currentPathogen,
      });
      
      const url = `${config.apiBaseUrl}/api/estimated-deaths-by-state?${params.toString()}`;
      const result = await safeFetch(url);
      setData(result);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData(newFilters, pathogen, state);
  };

  const handlePathogenChange = (e) => {
    const newPathogen = e.target.value;
    setPathogen(newPathogen);
    loadData(filters, newPathogen, state);
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setState(newState);
    loadData(filters, pathogen, newState);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📊 State Death Estimates</h1>
        <p className="page-subtitle" style={{ color: '#2d3748' }}>
          Estimate deaths by pathogen for a specific state and year based on national death rates
        </p>
      </div>

      {/* Top controls */}
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {/* Pathogen */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              Pathogen
            </label>
            <select value={pathogen} onChange={handlePathogenChange}>
              <option>COVID-19</option>
              <option>Influenza</option>
              <option>RSV</option>
            </select>
          </div>

          {/* State */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              State
            </label>
            <select value={state} onChange={handleStateChange}>
              <option value="">Select State</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Year filter only */}
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <FilterPanel
            onFilterChange={handleFilterChange}
            filters={{
              showYear: true,
              showWeek: false,
              showState: false,
              showDisease: false,
              showRace: false,
              showSex: false,
              showAgeGroup: false,
            }}
            yearOptions={[2020, 2021, 2022, 2023, 2024]}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div
            className="pulse"
            style={{ textAlign: 'center', padding: '2rem' }}
          >
            Calculating estimate...
          </div>
        ) : !data ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
            }}
          >
            Select a pathogen, state, and year to view estimated deaths
          </div>
        ) : (
          <>
            <h3
              style={{
                marginBottom: 'var(--spacing-xl)',
                color: '#ffffff',
              }}
            >
              Estimated Deaths
            </h3>
            <div className="grid grid-2">
              <div className="card-gradient">
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                  }}
                >
                  Estimated Deaths in {data.state}
                </div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '0.5rem',
                    color: '#ffffff',
                  }}
                >
                  {formatNumber(data.estimated_deaths)}
                </div>
              </div>
              <div className="card-gradient">
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                  }}
                >
                  Query Details
                </div>
                <div
                  style={{
                    marginTop: '1rem',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Pathogen:</strong> {data.pathogen}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Year:</strong> {data.year}
                  </div>
                  <div>
                    <strong>State:</strong> {data.state}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 'var(--spacing-xl)',
                padding: 'var(--spacing-lg)',
                background: 'var(--bg-darker)',
                borderRadius: 'var(--border-radius)',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem',
              }}
            >
              <strong>Note:</strong> This estimate is calculated by applying national death rates 
              (by age group) to the state's population distribution. Actual deaths may vary due to 
              regional health factors, healthcare access, and demographic differences.
            </div>
          </>
        )}
      </div>
    </div>
  );
}