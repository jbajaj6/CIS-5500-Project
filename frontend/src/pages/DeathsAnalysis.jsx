// src/pages/DeathsAnalysis.jsx - Query 3
import { useState } from 'react';
import config from '../config';
import { safeFetch, formatNumber, formatPercent } from '../utils';
import FilterPanel from '../components/FilterPanel';

const DEM_OPTIONS = {
  age_group: [
    '0-17 years',
    '18-64 years',
    '65+ years',
  ],
  race: [
    'AI/AN, NH',
    'Multiple/Other, NH',
    'Black, NH',
    'Asian/NHOPI, NH',
    'White, NH',
    'Hispanic',
    'Not Available',
  ],
  sex: [
    'Male',
    'Female',
  ],
};

export default function DeathsAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [pathogen, setPathogen] = useState('COVID-19');


  const [demographicType, setDemographicType] = useState('age_group');
  const [demographicValue, setDemographicValue] = useState('');

  const loadData = async (
    filterValues = filters,
    currentPathogen = pathogen,
    currentDemType = demographicType,
    currentDemValue = demographicValue
  ) => {
    const year = filterValues.year;

    if (!year || !currentDemType || !currentDemValue) {
      return;
    }

    setLoading(true);
    try {
      const paramsObj = {
        pathogen: currentPathogen,
        year: String(year),
      };

      if (currentDemType === 'race') {
        paramsObj.race = currentDemValue;
      } else if (currentDemType === 'sex') {
        paramsObj.sex = currentDemValue;
      } else if (currentDemType === 'age_group') {
        paramsObj.ageGroup = currentDemValue;
      }

      const params = new URLSearchParams(paramsObj);
      const url = `${config.apiBaseUrl}/api/deaths-by-pathogen-demographic?${params.toString()}`;
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
    loadData(newFilters, pathogen, demographicType, demographicValue);
  };

  const handlePathogenChange = (e) => {
    const newPathogen = e.target.value;
    setPathogen(newPathogen);
    loadData(filters, newPathogen, demographicType, demographicValue);
  };

  const handleDemographicTypeChange = (e) => {
    const newType = e.target.value;
    setDemographicType(newType);
    setDemographicValue('');
    setData(null);
  };

  const handleDemographicValueChange = (e) => {
    const newValue = e.target.value;
    setDemographicValue(newValue);
    loadData(filters, pathogen, demographicType, newValue);
  };

  const getDemographicOptions = () => {
    return DEM_OPTIONS[demographicType] || [];
  };

  const demographicTypeLabel =
    demographicType === 'race'
      ? 'Race'
      : demographicType === 'sex'
        ? 'Gender'
        : 'Age Group';

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">💔 Deaths by Demographics</h1>
        <p className="page-subtitle" style={{ color: '#2d3748' }}>
          Analyze death statistics by pathogen and a single demographic slice
          (age group, race, or gender)
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

          {/* Demographic Type */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              Demographic Type
            </label>
            <select value={demographicType} onChange={handleDemographicTypeChange}>
              <option value="age_group">Age Group</option>
              <option value="race">Race</option>
              <option value="sex">Gender</option>
            </select>
          </div>

          {/* Demographic Value (no label) */}
          <div style={{ marginTop: '1.5rem' }}>
            <select
              value={demographicValue}
              onChange={handleDemographicValueChange}
            >
              <option value="">{`Select ${demographicTypeLabel}`}</option>
              {getDemographicOptions().map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
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
            Calculating...
          </div>
        ) : !data ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
            }}
          >
            Select a pathogen, year, demographic type, and value, then apply
            filters to view deaths
          </div>
        ) : (
          <>
            <h3
              style={{
                marginBottom: 'var(--spacing-xl)',
                color: '#ffffff',
              }}
            >
              Results
            </h3>
            <div className="grid grid-3">
              <div className="card-gradient">
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                  }}
                >
                  Total Deaths
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
                  {formatNumber(data.totalDeaths)}
                </div>
              </div>
              <div className="card-gradient">
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                  }}
                >
                  All Deaths (Pathogen &amp; Year)
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
                  {formatNumber(data.sumOfTotalDeaths)}
                </div>
              </div>
              <div className="card-gradient">
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                  }}
                >
                  Percentage
                </div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '0.5rem',
                    color: '#667eea',
                  }}
                >
                  {formatPercent(data.percentDeaths)}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 'var(--spacing-xl)',
                padding: 'var(--spacing-lg)',
                background: 'var(--bg-darker)',
                borderRadius: 'var(--border-radius)',
                color: '#ffffff',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Pathogen:</strong> {data.pathogen}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Year:</strong> {data.year}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Demographic Type:</strong> {data.demographicType}
              </div>
              <div>
                <strong>Demographic Value:</strong> {data.demographicValue}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
