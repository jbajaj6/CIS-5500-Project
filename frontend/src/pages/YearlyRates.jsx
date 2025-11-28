// src/pages/YearlyRates.jsx - Query 2
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function YearlyRates() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ year: 2025, disease: '' });
    const [diseases, setDiseases] = useState([]);

    useEffect(() => {
        loadDiseases();
    }, []);

    const loadDiseases = async () => {
        try {
            const result = await safeFetch(`${config.apiBaseUrl}/api/diseases`);
            setDiseases(result);
            if (result.length > 0) {
                const firstDisease = result[0];
                setFilters(prev => ({ ...prev, disease: firstDisease.diseaseName }));
                loadData({ year: 2025, disease: firstDisease.diseaseName });
            }
        } catch (err) {
            console.error('Error loading diseases:', err);
        }
    };

    const loadData = async (filterValues) => {
        if (!filterValues.disease) return;

        setLoading(true);
        try {
            const disease = diseases.find(d => d.diseaseName === filterValues.disease);
            if (!disease) return;

            const url = `${config.apiBaseUrl}/api/state-yearly-percapita?year=${filterValues.year}&diseaseId=${disease.diseaseId}`;
            const result = await safeFetch(url);
            setData(result);
        } catch (err) {
            console.error('Error loading data:', err);
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
                <h1 className="page-title">Yearly Disease Rates by State</h1>
                <p className="page-subtitle">
                    Per-capita disease rates aggregated over an entire year for each state.
                </p>
            </div>

            <FilterPanel
                onFilterChange={handleFilterChange}
                filters={{ showState: false, showWeek: false, showRace: false, showSex: false, showAgeGroup: false }}
            />

            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {filters.disease} - {filters.year}
                </h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div className="pulse">Loading...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        Select a disease to view data
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                            <thead>
                                <tr>
                                    <th style={tableHeaderStyle}>State</th>
                                    <th style={tableHeaderStyle}>Per-Capita Cases</th>
                                    <th style={tableHeaderStyle}>Visualization</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => {
                                    const maxRate = Math.max(...data.map(d => Number(d.perCapitaYearlyCases || 0)));
                                    const percentage = (Number(item.perCapitaYearlyCases) / maxRate) * 100;

                                    return (
                                        <tr key={index} style={{ background: 'var(--bg-card)' }}>
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
};

const tableCellStyle = {
    padding: 'var(--spacing-md)',
    color: 'var(--text-primary)',
};
