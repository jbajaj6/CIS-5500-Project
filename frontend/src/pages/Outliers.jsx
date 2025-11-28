// src/pages/Outliers.jsx - Query 7
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function Outliers() {
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
                setFilters(prev => ({ ...prev, disease: result[0].diseaseName }));
                loadData({ year: 2025, disease: result[0].diseaseName });
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const loadData = async (filterValues) => {
        if (!filterValues.disease) return;
        setLoading(true);
        try {
            const url = `${config.apiBaseUrl}/api/states-high-outliers?diseaseName=${encodeURIComponent(filterValues.disease)}&year=${filterValues.year}`;
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
                <h1 className="page-title">📍 Statistical Outliers</h1>
                <p className="page-subtitle">States with disease rates more than 1 standard deviation above the national mean</p>
            </div>

            <FilterPanel onFilterChange={handleFilterChange} filters={{ showState: false, showWeek: false, showRace: false, showSex: false, showAgeGroup: false }} />

            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Outlier States - {filters.disease} ({filters.year})</h3>

                {loading ? (
                    <div className="pulse" style={{ textAlign: 'center', padding: '2rem' }}>Analyzing...</div>
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
