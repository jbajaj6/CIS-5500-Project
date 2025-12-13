// src/pages/LowRiskStates.jsx
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function LowRiskStates() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ year: 2025, disease: '' });
    const [diseases, setDiseases] = useState([]);

    useEffect(() => {
        loadDiseases();
    }, []);

    const loadDiseases = async () => {
        try {
            const result = await safeFetch(`${config.apiBaseUrl}/api/diseases?year=${year}`);
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
            const url = `${config.apiBaseUrl}/api/states-below-national-all-races?diseaseName=${encodeURIComponent(filterValues.disease)}&year=${filterValues.year}`;
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
                <h1 className="page-title">✅ Low Risk States</h1>
                <p className="page-subtitle" style={{ color: '#2d3748' }}>States where ALL racial demographics have lower rates than national average</p>
            </div>

            <FilterPanel onFilterChange={handleFilterChange} filters={{ showState: false, showWeek: false, showRace: false, showSex: false, showAgeGroup: false }} yearOptions={[2020, 2021, 2022, 2023, 2024]} />

            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>States Below National Average (All Races)</h3>

                {loading ? (
                    <div className="pulse" style={{ textAlign: 'center', padding: '2rem' }}>Analyzing...</div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No states qualify for this criteria
                    </div>
                ) : (
                    <div className="grid grid-4">
                        {data.map((item, i) => (
                            <div key={i} className="card" style={{ background: 'linear-gradient(135deg, rgba(0,242,254,0.1), rgba(79,172,254,0.1))', border: '1px solid rgba(0,242,254,0.3)', textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{item.stateName}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>All demographics below national avg</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
