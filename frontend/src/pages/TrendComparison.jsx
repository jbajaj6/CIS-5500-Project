// src/pages/TrendComparison.jsx
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label
} from 'recharts';

export default function TrendComparison() {
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(false);
    const year = 2025;
    const [filters, setFilters] = useState({ state: '', disease: '' });
    const [states, setStates] = useState([]);
    const [diseases, setDiseases] = useState([]);
    const [error, setError] = useState(null);
    const [weeklyError, setWeeklyError] = useState(null);

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
        } catch (err) {
            console.error('Error loading options:', err);
            setError('Failed to load options');
        }
    };

    const loadData = async (filterValues) => {
        if (!filterValues.state || !filterValues.disease) {
            setData([]);
            setWeeklyData([]);
            return;
        }
        setLoading(true);
        setError(null);
        setWeeklyError(null);
        try {
            // Yearly
            const url = `${config.apiBaseUrl}/api/state-vs-national-trend?stateName=${encodeURIComponent(filterValues.state)}&diseaseName=${encodeURIComponent(filterValues.disease)}&startYear=${year}&endYear=${year}`;
            const result = await safeFetch(url);
            setData(result || []);
        } catch (err) {
            console.error('Error loading yearly data:', err);
            setError(err.message || 'Failed to load data');
            setData([]);
        }

        try {
            const weeklyUrl = `${config.apiBaseUrl}/api/state-vs-national-trend-weekly?stateName=${encodeURIComponent(filterValues.state)}&diseaseName=${encodeURIComponent(filterValues.disease)}`;
            const weeklyResult = await safeFetch(weeklyUrl);
            setWeeklyData(Array.isArray(weeklyResult) ? weeklyResult : []);
        } catch (err) {
            console.error('Error loading weekly trend data:', err);
            setWeeklyError(err.message || 'Failed to load weekly trend data');
            setWeeklyData([]);
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
                    🔄 State vs National Trends
                    <span style={{ fontWeight: 500, color: '#a5b4fc', fontSize: '1.3rem', marginLeft: 8 }}>(2025)</span>
                </h1>
                <p className="page-subtitle" style={{ color: '#2d3748' }}>
                    Track and compare per-capita case rates for any state versus the national average, for a selected disease in 2025.<br />
                    Only diseases with at least one reported case in 2025 are included.
                </p>
                <p style={{
                    color: '#8f99b7',
                    fontSize: '0.95rem',
                    marginTop: '-0.5rem',
                    marginBottom: '1rem'
                }}>
                    Per-capita rates are calculated per 100,000 people, allowing direct comparison between states of different sizes and with the nation as a whole.
                </p>
            </div>

            <FilterPanel
                onFilterChange={handleFilterChange}
                filters={{ showYear: false, showWeek: false, showRace: false, showSex: false, showAgeGroup: false }}
            />

            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {filters.state || 'Select a state'} vs National Average - {year}
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
                        <div className="pulse">Loading trend data...</div>
                    </div>
                ) : !filters.state || !filters.disease ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        Select state and disease to view trends
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        No data available for the selected filters
                    </div>
                ) : (
                    <>
                        {data.length > 0 && (
                            <div style={{
                                position: 'relative',
                                height: 290,
                                background: 'var(--bg-darker)',
                                borderRadius: 'var(--border-radius)',
                                marginBottom: 'var(--spacing-xl)',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                gap: '42px',
                            }}>
                                {data.map((item, i) => {
                                    const maxValue = Math.max(...data.map(d => Math.max(d.stateCasesPer100k || 0, d.nationalCasesPer100k || 0)));
                                    const barMaxHeight = 230;
                                    const stateHeight = maxValue > 0 ? (item.stateCasesPer100k / maxValue) * barMaxHeight : 0;
                                    const natlHeight = maxValue > 0 ? (item.nationalCasesPer100k / maxValue) * barMaxHeight : 0;
                                    return (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '9px', height: barMaxHeight }}>
                                                {/* State bar */}
                                                <div style={{
                                                    width: '26px',
                                                    height: `${stateHeight}px`,
                                                    background: 'linear-gradient(180deg, #667eea, #764ba2)',
                                                    borderRadius: '8px 8px 0 0',
                                                    transition: 'height 0.4s cubic-bezier(.4,2,.3,1)',
                                                    boxShadow: '0 0 5px #764ba2cc',
                                                }} title="State" />
                                                {/* National bar */}
                                                <div style={{
                                                    width: '26px',
                                                    height: `${natlHeight}px`,
                                                    background: 'linear-gradient(180deg, #4facfe, #00f2fe)',
                                                    borderRadius: '8px 8px 0 0',
                                                    transition: 'height 0.4s cubic-bezier(.4,2,.3,1)',
                                                    boxShadow: '0 0 5px #00f2fe88',
                                                }} title="National" />
                                            </div>
                                            {/* Year label removed */}
                                        </div>
                                    );
                                })}
                                {/* Legend above bars */}
                                <div style={{
                                    position: 'absolute',
                                    top: '18px', left: '50%', transform: 'translateX(-50%)',
                                    display: 'flex', gap: '16px', alignItems: 'center',
                                    fontWeight: 500, fontSize: '1rem', color: '#b5c0f7',
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ width: 16, height: 9, background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 3 }} />
                                        {filters.state || 'State'}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ width: 16, height: 9, background: 'linear-gradient(90deg, #4facfe, #00f2fe)', borderRadius: 3 }} />
                                        National
                                    </span>
                                </div>
                            </div>
                        )}

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
                                        const diff = (item.stateCasesPer100k || 0) - (item.nationalCasesPer100k || 0);
                                        const isAbove = diff > 0;

                                        return (
                                            <tr
                                                key={index}
                                                style={{
                                                    background: index % 2 === 0 ? 'var(--bg-card)' : 'rgba(30, 33, 58, 0.4)',
                                                    transition: 'background-color 0.2s ease',
                                                }}
                                            >
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


            <div className="card" style={{ marginTop: '2.5rem', background: 'var(--bg-darker)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                    State Weekly Case Counts
                </h3>
                {weeklyError && (
                    <div style={{
                        background: 'rgba(255, 8, 68, 0.1)',
                        border: '1px solid rgba(255, 8, 68, 0.3)',
                        borderRadius: 'var(--border-radius)',
                        padding: 'var(--spacing-lg)',
                        color: 'var(--danger)',
                        marginBottom: 'var(--spacing-lg)',
                    }}>
                        Error: {weeklyError}
                    </div>
                )}
                {weeklyData && weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart
                            data={weeklyData}
                            margin={{ top: 20, right: 40, left: 10, bottom: 32 }}
                        >
                            <CartesianGrid strokeDasharray="2 7" stroke="#25273a" />
                            <XAxis dataKey="week" tick={{ fill: '#a5b4fc', fontWeight: 500 }}>
                                <Label value="Week" position="bottom" fill="#8489ac" fontSize={14} offset={-2} />
                            </XAxis>
                            <YAxis
                                tickFormatter={formatPer100k}
                                tick={{ fill: '#a5b4fc', fontWeight: 500 }}
                                domain={[0, dataMax => Math.ceil(dataMax * 1.1)]}
                            >
                                <Label
                                    value="Cases"
                                    angle={-90}
                                    position="insideLeft"
                                    fill="#a5b4fc"
                                    style={{ textAnchor: 'middle' }}
                                    fontSize={14}
                                />
                            </YAxis>
                            <Tooltip
                                formatter={v => formatPer100k(v)}
                                labelFormatter={w => `Week ${w}`}
                                contentStyle={{ background: '#21213a', border: '1px solid #2a295d', color: '#fff' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="total_cases"
                                name={filters.state || 'State'}
                                stroke="url(#linearStateWeekly)"
                                strokeWidth={4}
                                dot={{ r: 2, stroke: '#5a61e6', strokeWidth: 1.5, fill: '#a685fa' }}
                                isAnimationActive={false}
                            />
                            <defs>
                                <linearGradient id="linearStateWeekly" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="2%" stopColor="#667eea" />
                                    <stop offset="98%" stopColor="#764ba2" />
                                </linearGradient>
                            </defs>
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2.5rem 0 1rem 0' }}>
                        {filters.state && filters.disease ? 'No weekly data available for this selection' : 'Select state and disease to see weekly data'}
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
