// src/pages/DisparityAnalysis.jsx - Query 8
import { useState } from 'react';
import config from '../config';
import { safeFetch } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function DisparityAnalysis() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = async (filterValues) => {
        if (!filterValues.state || !filterValues.disease) return;
        setLoading(true);
        try {
            const url = `${config.apiBaseUrl}/api/state-demographic-overunder?stateName=${encodeURIComponent(filterValues.state)}&diseaseName=${encodeURIComponent(filterValues.disease)}&year=${filterValues.year}`;
            const result = await safeFetch(url);
            setData(result.sort((a, b) => b.overUnderExposure - a.overUnderExposure));
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">⚖️ Demographic Disparity Analysis</h1>
                <p className="page-subtitle" style={{ color: '#2d3748' }}>Compare demographic groups' share of cases vs population share</p>
            </div>

            <FilterPanel onFilterChange={loadData} filters={{ showWeek: false, showRace: false, showSex: false, showAgeGroup: false }} yearOptions={[2022, 2023]} />

            <div className="card">
                {loading ? <div className="pulse" style={{ textAlign: 'center', padding: '2rem' }}>Analyzing...</div> :
                    data.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                <thead><tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Race</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sex</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Age Group</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Over/Under Exposure</th>
                                </tr></thead>
                                <tbody>
                                    {data.map((item, i) => (
                                        <tr key={i} style={{ background: 'var(--bg-card)' }}>
                                            <td style={{ padding: '1rem' }}>{item.race}</td>
                                            <td style={{ padding: '1rem' }}>{item.sex}</td>
                                            <td style={{ padding: '1rem' }}>{item.ageGroup}</td>
                                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: item.overUnderExposure > 0 ? '#ff0844' : '#00f2fe', fontWeight: '700' }}>
                                                {(item.overUnderExposure * 100).toFixed(2)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Select state and disease</div>}
            </div>
        </div>
    );
}
