// src/pages/DemographicCases.jsx - Query 4
import { useState } from 'react';
import config from '../config';
import { safeFetch, formatNumber, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function DemographicCases() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});

    const loadData = async (filterValues) => {
        if (!filterValues.state || !filterValues.disease || !filterValues.race || !filterValues.sex || !filterValues.ageGroup) {
            return;
        }
        setLoading(true);
        try {
            const url = `${config.apiBaseUrl}/api/estimated-demographic-cases?stateName=${encodeURIComponent(filterValues.state)}&diseaseName=${encodeURIComponent(filterValues.disease)}&year=${filterValues.year}&race=${encodeURIComponent(filterValues.race)}&sex=${encodeURIComponent(filterValues.sex)}&ageGroup=${encodeURIComponent(filterValues.ageGroup)}`;
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
                <h1 className="page-title">👤 Demographic Cases Estimator</h1>
                <p className="page-subtitle" style={{ color: '#2d3748' }}>Estimate disease cases for specific demographic groups within a state</p>
            </div>

            <FilterPanel
                onFilterChange={handleFilterChange}
                filters={{ showRace: true, showSex: true, showAgeGroup: true }}
                yearOptions={[2020, 2021, 2022, 2023, 2024]}
            />

            <div className="card">
                {loading ? (
                    <div className="pulse" style={{ textAlign: 'center', padding: '2rem' }}>Calculating...</div>
                ) : !data ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Select all filters to view estimated cases
                    </div>
                ) : (
                    <>
                        <h3 style={{ marginBottom: 'var(--spacing-xl)', color: '#ffffff' }}>Results</h3>
                        <div className="grid grid-2">
                            <div className="card-gradient">
                                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Estimated Cases</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{formatNumber(data.estimatedDemographicCases)}</div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    {data.race}, {data.sex}, {data.ageGroup}
                                </div>
                            </div>
                            <div className="card-gradient">
                                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Cases per 100k</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#667eea' }}>{formatPer100k(data.casesPer100k)}</div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Population: {formatNumber(data.population)}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', background: 'var(--bg-darker)', borderRadius: 'var(--border-radius)', color: '#ffffff' }}>
                            <div style={{ marginBottom: '0.5rem' }}><strong>State:</strong> {data.stateName}</div>
                            <div style={{ marginBottom: '0.5rem' }}><strong>Disease:</strong> {data.diseaseName}</div>
                            <div style={{ marginBottom: '0.5rem' }}><strong>Year:</strong> {data.year}</div>
                            <div><strong>Total State Cases:</strong> {formatNumber(data.totalYearlyCases)}</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
