// src/pages/YearlyRates.jsx - Query 2
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function YearlyRates() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const year = 2025; // Hardcoded to 2025 as that's the only year with data
    const [filters, setFilters] = useState({ disease: '' });
    const [diseases, setDiseases] = useState([]);
    const [error, setError] = useState(null);
    const [showNonZeroOnly, setShowNonZeroOnly] = useState(false);

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
        if (!filterValues.disease) {
            setData([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Find the disease ID from the disease name
            const disease = diseases.find(d => d.diseaseName === filterValues.disease);
            if (!disease) {
                setError(null);
                setData([]);
                return;
            }

            const url = `${config.apiBaseUrl}/api/state-yearly-percapita?year=${year}&diseaseId=${disease.diseaseId}`;
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

    // Filter data if showNonZeroOnly is checked
    const displayData = showNonZeroOnly
        ? data.filter(row => Number(row.perCapitaYearlyCases) > 0)
        : data;

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">Yearly Disease Rates by State</h1>
                <p className="page-subtitle" style={{ color: '#2d3748' }}>
                    Per-capita disease rates aggregated over an entire year for each state (per 100k people).
                </p>
                <p style={{
                    marginTop: 'var(--spacing-sm)',
                    color: '#2d3748',
                    fontSize: '1rem',
                    fontWeight: '500'
                }}>
                    for {year}
                </p>
            </div>

            <FilterPanel
                onFilterChange={handleFilterChange}
                filters={{ showYear: false, showState: false, showWeek: false, showRace: false, showSex: false, showAgeGroup: false }}
            />

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={showNonZeroOnly}
                        onChange={() => setShowNonZeroOnly(v => !v)}
                        style={{ marginRight: '0.5rem' }}
                    />
                    Show only nonzero values
                </label>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {filters.disease || 'Select a disease'} - {year}
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
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div className="pulse">Loading...</div>
                    </div>
                ) : !filters.disease ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        Select a disease to view data
                    </div>
                ) : displayData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        No data available for the selected disease
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                            <thead>
                                <tr>
                                    <th style={tableHeaderStyle}>State</th>
                                    <th style={tableHeaderStyle}>Per-Capita Cases (per 100k people)</th>
                                    <th style={tableHeaderStyle}>Visualization</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.map((item, index) => {
                                    const maxRate = Math.max(...data.map(d => Number(d.perCapitaYearlyCases || 0)));
                                    const percentage = maxRate > 0 ? (Number(item.perCapitaYearlyCases || 0) / maxRate) * 100 : 0;

                                    return (
                                        <tr 
                                            key={index} 
                                            style={{ 
                                                background: index % 2 === 0 ? 'var(--bg-card)' : 'rgba(30, 33, 58, 0.4)',
                                                transition: 'background-color 0.2s ease',
                                            }}
                                        >
                                            <td style={{ ...tableCellStyle, fontWeight: '600' }}>{item.stateName}</td>
                                            <td style={{ ...tableCellStyle, fontFamily: 'var(--font-mono)' }}>
                                                {formatPer100k(item.perCapitaYearlyCases)}
                                            </td>
                                            <td style={tableCellStyle}>
                                                <div style={{
                                                    height: '20px',
                                                    background: 'var(--bg-darker)',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${percentage}%`,
                                                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                                        transition: 'width 0.5s ease',
                                                    }} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

const tableHeaderStyle = {
    textAlign: 'left',
    padding: 'var(--spacing-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
};

const tableCellStyle = {
    padding: 'var(--spacing-md)',
    color: 'var(--text-primary)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};
