// src/pages/DeathsAnalysis.jsx - Query 3
import { useState } from 'react';
import config from '../config';
import { safeFetch, formatNumber, formatPercent } from '../utils';

export default function DeathsAnalysis() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pathogen, setPathogen] = useState('COVID-19');
    const [demographic, setDemographic] = useState('Age Group');
    const [demoValue, setDemoValue] = useState('65+ years');

    const loadData = async () => {
        setLoading(true);
        try {
            const url = `${config.apiBaseUrl}/api/deaths-by-pathogen-demographic?pathogen=${pathogen}&yearStart=2020&yearEnd=2023&monthStart=1&monthEnd=12&demographicType=${demographic}&demographicValue=${encodeURIComponent(demoValue)}`;
            const result = await safeFetch(url);
            setData(result);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">💔 Deaths by Demographics</h1>
                <p className="page-subtitle">Analyze death statistics by pathogen and demographic characteristics</p>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pathogen</label>
                        <select value={pathogen} onChange={e => setPathogen(e.target.value)}>
                            <option>COVID-19</option>
                            <option>Influenza</option>
                            <option>RSV</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Demographic Type</label>
                        <select value={demographic} onChange={e => setDemographic(e.target.value)}>
                            <option>Age Group</option>
                            <option>Sex</option>
                            <option>Race/Hispanic</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Value</label>
                        <input value={demoValue} onChange={e => setDemoValue(e.target.value)} />
                    </div>
                </div>
                <button className="btn-primary" onClick={loadData} style={{ marginTop: 'var(--spacing-lg)' }}>Analyze</button>
            </div>

            {data && (
                <div className="grid grid-3">
                    <div className="card-gradient">
                        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>Total Deaths</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '0.5rem', color: '#ffffff' }}>{formatNumber(data.totalDeaths)}</div>
                    </div>
                    <div className="card-gradient">
                        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>All Deaths (Period)</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '0.5rem', color: '#ffffff' }}>{formatNumber(data.sumOfTotalDeaths)}</div>
                    </div>
                    <div className="card-gradient">
                        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>Percentage</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '0.5rem', color: '#667eea' }}>{formatPercent(data.percentDeaths)}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
