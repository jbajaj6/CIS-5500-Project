import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';

export default function SimilarSymptoms() {
    const [input, setInput] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async() => {
        if(!input.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const url = `${config.apiBaseUrl}/api/similar-symptoms?text=${encodeURIComponent(input)}`;
            const response = await safeFetch(url);
            setData(response);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Failed to load similar diseases');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container fade-in">
        <div className="page-header">
            <h1 className="page-title">🧬 Symptom Checker</h1>
            <p className="page-subtitle">Describe your symptoms to diagnose yourself.</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
            <input
                type="text"
                placeholder="E.g., fever, rash, joint pain..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    marginBottom: '1rem',
                    fontSize: '1rem',
                }}
            />

            <button
                onClick={handleSearch}
                style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#00d2ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                }}
            >
                Search
            </button>

            {loading && <p style={{ marginTop: '1rem' }}>Searching...</p>}
            {error && <p style={{ marginTop: '1rem', color: 'red' }}>{error}</p>}
        </div>

        <div className="card">
                <h3>Diseases with Similar Symptoms</h3>
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
                        <div className="pulse">Loading...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        No diseases are similar at all
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>Disease</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>Similarity (lower score = more similar) </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, i) => (
                                    <tr 
                                        key={i} 
                                        style={{ 
                                            background: i % 2 === 0 ? 'var(--bg-card)' : 'rgba(30, 33, 58, 0.4)',
                                            transition: 'background-color 0.2s ease',
                                        }}
                                    >
                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>{item.disease_name}</td>
                                        <td style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>{item.distance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


    </div>
    );
}