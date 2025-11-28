// src/pages/RisingTrends.jsx - Query 6
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function RisingTrends() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ disease: '', year: 2022 });
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
                loadData({ disease: firstDisease.diseaseName, year: 2022 });
            }
        } catch (err) {
            console.error('Error loading diseases:', err);
        }
    };

    const loadData = async (filterValues) => {
        if (!filterValues.disease) return;

        setLoading(true);
        try {
            const endYear = Number(filterValues.year) + 3;
            const url = `${config.apiBaseUrl}/api/states-rising-4years?diseaseName=${encodeURIComponent(filterValues.disease)}&startYear=${filterValues.year}&endYear=${endYear}`;
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
                <h1 className="page-title">⚠️ Rising Trend Alerts</h1>
                <p className="page-subtitle">
                    Identifies states where disease rates have increased consistently over 4 consecutive years.
                    These represent concerning upward trends requiring attention.
                </p>
            </div>

            <FilterPanel
                onFilterChange={handleFilterChange}
                filters={{
                    showState: false,
                    showWeek: false,
                    showRace: false,
                    showSex: false,
                    showAgeGroup: false
                }}
            />

            <div className="card">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-lg)',
                }}>
                    <h3>States with Rising Trends</h3>
                    <div style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 8, 68, 0.2)',
                        borderRadius: 'var(--border-radius)',
                        color: '#ff0844',
                        fontWeight: '600',
                    }}>
                        {data.length} Alert{data.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div className="pulse">Analyzing trends...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-2xl)',
                        background: 'rgba(0, 242, 254, 0.1)',
                        borderRadius: 'var(--border-radius)',
                        color: '#00f2fe',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>✅</div>
                        <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
                            No Rising Trends Detected
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            No states show consistent 4-year increases for {filters.disease}
                            ({filters.year}-{Number(filters.year) + 3})
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 'var(--spacing-md)',
                    }}>
                        {data.map((item, index) => (
                            <div
                                key={index}
                                className="card"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255, 8, 68, 0.1) 0%, rgba(255, 177, 153, 0.1) 100%)',
                                    border: '1px solid rgba(255, 8, 68, 0.3)',
                                    animation: `fadeIn 0.5s ease ${index * 0.1}s both`,
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-md)',
                                    marginBottom: 'var(--spacing-md)',
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: 'linear-gradient(135deg, #ff0844, #ffb199)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                    }}>
                                        ⚠️
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '1.25rem' }}>
                                            {item.stateName}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            4-Year Rising Trend
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: 'var(--border-radius-sm)',
                                }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Period: {filters.year}-{Number(filters.year) + 3}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        Disease: {filters.disease}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!loading && data.length > 0 && (
                <div className="card" style={{
                    marginTop: 'var(--spacing-xl)',
                    background: 'rgba(255, 8, 68, 0.05)',
                    border: '1px solid rgba(255, 8, 68, 0.2)',
                }}>
                    <h4 style={{ color: '#ff0844', marginBottom: 'var(--spacing-md)' }}>
                        📋 Recommendations
                    </h4>
                    <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        <li>Investigate potential causes of rising trends in these states</li>
                        <li>Review public health interventions and resource allocation</li>
                        <li>Consider enhanced surveillance and preventive measures</li>
                        <li>Compare with neighboring states for regional patterns</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
