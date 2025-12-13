// src/pages/Outliers.jsx
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function Outliers() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const year = 2025;
    const [filters, setFilters] = useState({ disease: '' });
    const [diseases, setDiseases] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDiseases();
    }, []);

    const loadDiseases = async () => {
        try {
            const result = await safeFetch(`${config.apiBaseUrl}/api/diseases?year=${year}`);
            setDiseases(result);
        } catch (err) {
            console.error('Error:', err);
            setError('Failed to load diseases');
        }
    };

    const loadData = async (filterValues) => {
        if (!filterValues.disease) {
            setData([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const url = `${config.apiBaseUrl}/api/states-high-outliers?diseaseName=${encodeURIComponent(filterValues.disease)}&year=${year}`;
            const result = await safeFetch(url);
            setData(result || []);
        } catch (err) {
            console.error('Error:', err);
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

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">
                    📍 Statistical Outliers
                    <span style={{ fontWeight: 500, color: '#a5b4fc', fontSize: '1.3rem', marginLeft: 8 }}>(2025)</span>
                </h1>
                <p className="page-subtitle" style={{ color: '#2d3748' }}>
                    Identifies states with weekly per-capita disease rates more than 1 standard deviation above the national mean
                    for the selected disease in 2025.<br />
                    Only diseases with at least one reported case in 2025 are included.
                </p>
                <p style={{
                    color: '#8f99b7',
                    fontSize: '0.95rem',
                    marginTop: '-0.5rem',
                    marginBottom: '1rem'
                }}>
                    Outlier states are highlighted when their per-capita rate exceeds <b>mean + 1 standard deviation</b> for the selected disease and year.
                </p>
            </div>

            <FilterPanel
                onFilterChange={handleFilterChange}
                filters={{ showYear: false, showState: false, showWeek: false, showRace: false, showSex: false, showAgeGroup: false }}
            />

            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                    Outlier States - {filters.disease || 'Select a disease'} ({year})
                </h3>

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
                    <div className="pulse" style={{ textAlign: 'center', padding: '2rem' }}>Analyzing...</div>
                ) : !filters.disease ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Select a disease to view data
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#00f2fe' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <div>No statistical outliers detected</div>
                    </div>
                ) : (
                    <div className="grid grid-3">
                        {data.map((item, i) => (
                            <div key={i} className="card" style={{ background: 'linear-gradient(135deg, rgba(255,8,68,0.2), rgba(255,177,153,0.2))', border: '1px solid rgba(255,8,68,0.4)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>{item.stateName}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', color: '#ff0844', fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>
                                    {formatPer100k(item.perCapita)}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                                    Avg: {formatPer100k(item.avgRate)} | StdDev: {formatPer100k(item.stdRate)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
