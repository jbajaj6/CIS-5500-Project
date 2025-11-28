// src/pages/TrendComparison.jsx - Query 10
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function TrendComparison() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ state: '', disease: '', year: 2020 });
    const [states, setStates] = useState([]);
    const [diseases, setDiseases] = useState([]);

    useEffect(() => {
        loadOptions();
    }, []);

    const loadOptions = async () => {
        try {
            const [statesData, diseasesData] = await Promise.all([
                safeFetch(`${config.apiBaseUrl}/api/states`),
                safeFetch(`${config.apiBaseUrl}/api/diseases`),
            ]);
            setStates(statesData);
            setDiseases(diseasesData);

            if (statesData.length > 0 && diseasesData.length > 0) {
                const initialFilters = {
                    state: statesData[0].stateName,
                    disease: diseasesData[0].diseaseName,
                    year: 2020,
                };
                setFilters(initialFilters);
                loadData(initialFilters);
            }
        } catch (err) {
            console.error('Error loading options:', err);
        }
    };

    const loadData = async (filterValues) => {
        if (!filterValues.state || !filterValues.disease) return;

        setLoading(true);
        try {
            const endYear = Number(filterValues.year) + 4;
            const url = `${config.apiBaseUrl}/api/state-vs-national-trend?stateName=${encodeURIComponent(filterValues.state)}&diseaseName=${encodeURIComponent(filterValues.disease)}&startYear=${filterValues.year}&endYear=${endYear}`;
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
                <h1 className="page-title">🔄 State vs National Trends</h1>
                <p className="page-subtitle">
                    Compare disease rates between a specific state and national averages over time.
                </p>
            </div>

            <FilterPanel
                onFilterChange={handleFilterChange}
                filters={{ showWeek: false, showRace: false, showSex: false, showAgeGroup: false }}
            />

            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {filters.state} vs National Average
                </h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div className="pulse">Loading trend data...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        Select state and disease to view trends
                    </div>
                ) : (
                    <>
                        {/* Line Chart Visualization */}
                        <div style={{
                            background: 'var(--bg-darker)',
                            borderRadius: 'var(--border-radius)',
                            padding: 'var(--spacing-xl)',
                            marginBottom: 'var(--spacing-xl)',
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-lg)',
                                justifyContent: 'center',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        width: '20px',
                                        height: '3px',
                                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                    }} />
                                    <span style={{ fontSize: '0.875rem' }}>{filters.state}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        width: '20px',
                                        height: '3px',
                                        background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                                    }} />
                                    <span style={{ fontSize: '0.875rem' }}>National Average</span>
                                </div>
                            </div>

                            {/* Simple line chart */}
                            <div style={{ position: 'relative', height: '300px' }}>
                                {data.map((item, index) => {
                                    const maxRate = Math.max(
                                        ...data.map(d => Math.max(d.stateCasesPer100k, d.nationalCasesPer100k))
                                    );
                                    const stateHeight = (item.stateCasesPer100k / maxRate) * 250;
                                    const nationalHeight = (item.nationalCasesPer100k / maxRate) * 250;
                                    const xPos = (index / (data.length - 1)) * 100;

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                position: 'absolute',
                                                left: `${xPos}%`,
                                                bottom: 0,
                                                width: '2px',
                                                height: '300px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'flex-end',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {/* State bar */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                width: '8px',
                                                height: `${stateHeight}px`,
                                                background: 'linear-gradient(180deg, #667eea, #764ba2)',
                                                borderRadius: '4px 4px 0 0',
                                                marginRight: '6px',
                                            }} />
                                            {/* National bar */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                width: '8px',
                                                height: `${nationalHeight}px`,
                                                background: 'linear-gradient(180deg, #4facfe, #00f2fe)',
                                                borderRadius: '4px 4px 0 0',
                                                marginLeft: '6px',
                                            }} />
                                            {/* Year label */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-30px',
                                                fontSize: '0.75rem',
                                                color: 'var(--text-tertiary)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {item.year}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Data Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                <thead>
                                    <tr>
                                        <th style={tableHeaderStyle}>Year</th>
                                        <th style={tableHeaderStyle}>{filters.state} Rate</th>
                                        <th style={tableHeaderStyle}>National Rate</th>
                                        <th style={tableHeaderStyle}>Difference</th>
                                        <th style={tableHeaderStyle}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, index) => {
                                        const diff = item.stateCasesPer100k - item.nationalCasesPer100k;
                                        const isAbove = diff > 0;

                                        return (
                                            <tr key={index} style={{ background: 'var(--bg-card)' }}>
                                                <td style={{ ...tableCellStyle, fontWeight: '600' }}>{item.year}</td>
                                                <td style={{ ...tableCellStyle, fontFamily: 'var(--font-mono)' }}>
                                                    {formatPer100k(item.stateCasesPer100k)}
                                                </td>
                                                <td style={{ ...tableCellStyle, fontFamily: 'var(--font-mono)' }}>
                                                    {formatPer100k(item.nationalCasesPer100k)}
                                                </td>
                                                <td style={{
                                                    ...tableCellStyle,
                                                    fontFamily: 'var(--font-mono)',
                                                    color: isAbove ? '#ff0844' : '#00f2fe',
                                                    fontWeight: '600',
                                                }}>
                                                    {isAbove ? '+' : ''}{formatPer100k(diff)}
                                                </td>
                                                <td style={tableCellStyle}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        background: isAbove ? 'rgba(255, 8, 68, 0.2)' : 'rgba(0, 242, 254, 0.2)',
                                                        color: isAbove ? '#ff0844' : '#00f2fe',
                                                    }}>
                                                        {isAbove ? 'Above' : 'Below'} National
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
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
