// src/pages/WeeklyRates.jsx - Query 1
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function WeeklyRates() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ year: 2025, week: 1, disease: '' });

    const loadData = async (filterValues) => {
        if (!filterValues.disease) return;
        setLoading(true);
        try {
            // This would require getting diseaseId first, simplified for now
            const url = `${config.apiBaseUrl}/api/state-weekly-percapita?year=${filterValues.year}&week=${filterValues.week}&diseaseIds=1`;
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
        loadData(newFilters);
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">📅 Weekly Disease Rates</h1>
                <p className="page-subtitle">State-level per-capita rates for a specific week with comparison to 52-week maximum</p>
            </div>

            <FilterPanel onFilterChange={handleFilterChange} filters={{ showState: false, showRace: false, showSex: false, showAgeGroup: false, showWeek: true }} />

            <div className="card">
                <h3>Weekly Data - Week {filters.week}, {filters.year}</h3>
                {loading ? <div className="pulse" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div> :
                    data.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%' }}>
                                <thead><tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>State</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Disease</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Weekly Cases (per capita)</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>52-Week Max (per capita)</th>
                                </tr></thead>
                                <tbody>
                                    {data.map((item, i) => (
                                        <tr key={i} style={{ background: 'var(--bg-card)' }}>
                                            <td style={{ padding: '1rem' }}>{item.state_name}</td>
                                            <td style={{ padding: '1rem' }}>{item.disease_name}</td>
                                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>{formatPer100k(item.perCapitaWeeklyCases)}</td>
                                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>{formatPer100k(item.perCapita52WeekMax)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Select filters to view data</div>
                }
            </div>
        </div>
    );
}
