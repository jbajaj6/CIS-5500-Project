// src/pages/WeeklyRates.jsx - Query 1
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function WeeklyRates() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const year = 2025; // Hardcoded to 2025 as that's the only year with data
    const [filters, setFilters] = useState({ week: 1, disease: '' });
    const [diseases, setDiseases] = useState([]);
    const [error, setError] = useState(null);
    const [showNonZeroOnly, setShowNonZeroOnly] = useState(false);
    const [sortMode, setSortMode] = useState('alpha'); // 'alpha' or 'cases'

    useEffect(() => {
        loadDiseases();
    }, []);

    const loadDiseases = async () => {
        try {
            const result = await safeFetch(`${config.apiBaseUrl}/api/diseases?year=${year}`);
            setDiseases(result);
        } catch (err) {
            console.error('Error loading diseases:', err);
            setError('Failed to load diseases');
        }
    };

    const loadData = async (filterValues) => {
        if (!filterValues.disease || !filterValues.week) {
            setData([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Find the disease ID from the disease name
            const disease = diseases.find(d => d.diseaseName === filterValues.disease);
            if (!disease) {
                setError('Disease not found');
                setData([]);
                return;
            }

            const url = `${config.apiBaseUrl}/api/state-weekly-percapita?year=${year}&week=${filterValues.week}&diseaseIds=${disease.diseaseId}`;
            const result = await safeFetch(url);
            setData(result || []);
        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message || 'Failed to load data');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        loadData(newFilters);
    };

    let displayData = data;
    if (showNonZeroOnly) {
        displayData = displayData.filter(
            row => Number(row.perCapitaWeeklyCases) > 0 || Number(row.perCapita52WeekMax) > 0
        );
    }
    if (sortMode === 'cases') {
        displayData = [...displayData].sort((a, b) => Number(b.perCapitaWeeklyCases) - Number(a.perCapitaWeeklyCases));
    } else {
        displayData = [...displayData].sort((a, b) => a.state_name.localeCompare(b.state_name));
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">📅 Weekly Disease Rates <span style={{ fontWeight: 500, color: '#a5b4fc', fontSize: '1.3rem', marginLeft: 8 }}>(2025)</span></h1>
                <p className="page-subtitle" style={{ color: '#2d3748' }}>
                    State-level per-capita case rates for a specific week, with context from that state's 52-week maximum.<br/>
                    Only diseases with at least one reported case in 2025 are included, but it's normal for some states to have zero cases in a given week.
                </p>
                <p style={{
                    color: '#8f99b7',
                    fontSize: '0.95rem',
                    marginTop: '-0.5rem',
                    marginBottom: '1rem'
                }}>
                    <span style={{fontWeight:500}}>*</span> The “52-week maximum” is the highest per-capita rate for the selected disease in the current year, up to the selected week.
                </p>
            </div>

            <FilterPanel 
                onFilterChange={handleFilterChange} 
                filters={{ showYear: false, showState: false, showRace: false, showSex: false, showAgeGroup: false, showWeek: true }} 
            />

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <label style={{ fontWeight: '500' }}>
                    <input
                        type="checkbox"
                        checked={showNonZeroOnly}
                        onChange={() => setShowNonZeroOnly(v => !v)}
                        style={{ marginRight: '0.5rem' }}
                    />
                    Show only nonzero values
                </label>
                <button
                    className="btn-secondary"
                    onClick={() => setSortMode(mode => mode === 'alpha' ? 'cases' : 'alpha')}
                    style={{ minWidth: 180 }}
                >
                    Sort: {sortMode === 'alpha' ? 'Alphabetical' : 'By Weekly Cases ↓'}
                </button>
            </div>

            <div className="card">
                <h3>Weekly Data - Week {filters.week}, {year}</h3>
                {error && (
                    <div style={{
                        background: 'rgba(255, 8, 68, 0.1)',
                        border: '1px solid rgba(255, 8, 68, 0.3)',
                        borderRadius: 'var(--border-radius)',
                        padding: 'var(--spacing-lg)',
                        color: 'var(--danger)',
                        marginBottom: 'var(--spacing-lg)',
                    }}>
                        Error: {error}
                    </div>
                )}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div className="pulse">Loading...</div>
                    </div>
                ) : !filters.disease ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        Select a disease to view data
                    </div>
                ) : displayData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        No data available for the selected filters
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>State</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>Disease</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>Weekly Cases (per capita)</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>52-Week Max (per capita)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.map((item, i) => (
                                    <tr 
                                        key={i} 
                                        style={{ 
                                            background: i % 2 === 0 ? 'var(--bg-card)' : 'rgba(30, 33, 58, 0.4)',
                                            transition: 'background-color 0.2s ease',
                                        }}
                                    >
                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>{item.state_name}</td>
                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>{item.disease_name}</td>
                                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            {formatPer100k(item.perCapitaWeeklyCases)}
                                        </td>
                                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            {formatPer100k(item.perCapita52WeekMax)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
