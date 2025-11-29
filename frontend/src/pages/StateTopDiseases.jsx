// src/pages/StateTopDiseases.jsx
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatPer100k } from '../utils';

export default function StateTopDiseases() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year] = useState(2025);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${config.apiBaseUrl}/api/top-states-by-disease?year=${year}`;
      const result = await safeFetch(url);
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">State Top Diseases</h1>
        <p className="page-subtitle" style={{ color: '#2d3748' }}>
          Shows the top disease per capita for each state, sorted alphabetically.
        </p>
      </div>

      <div className="card">
        {loading && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
            <div className="pulse">Loading data...</div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(255, 8, 68, 0.1)',
            border: '1px solid rgba(255, 8, 68, 0.3)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--spacing-lg)',
            color: 'var(--danger)',
          }}>
            Error loading data: {error}
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-2xl)',
            color: 'var(--text-secondary)',
          }}>
            No data available
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>State</th>
                  <th style={tableHeaderStyle}>Disease</th>
                  <th style={tableHeaderStyle}>Cases per 100k</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      ...tableRowStyle,
                      background: index % 2 === 0 ? 'var(--bg-card)' : 'rgba(30, 33, 58, 0.4)',
                    }}
                  >
                    <td style={tableCellStyle}>{item.stateName}</td>
                    <td style={tableCellStyle}>{item.diseaseName}</td>
                    <td style={{
                      ...tableCellStyle,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '600',
                      color: getRateColor(item.casesPer100k),
                    }}>
                      {formatPer100k(item.casesPer100k)}
                    </td>
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

// Styles
const tableHeaderStyle = {
  textAlign: 'left',
  padding: 'var(--spacing-md)',
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
};

const tableRowStyle = {
  transition: 'background-color 0.2s ease',
};

const tableCellStyle = {
  padding: 'var(--spacing-md)',
  color: 'var(--text-primary)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};

// Helper function
function getRateColor(rate) {
  if (!rate || rate === null || rate === undefined) return 'var(--text-secondary)';
  if (rate > 1000) return '#ff0844';
  if (rate > 500) return '#fee140';
  if (rate > 100) return '#00f2fe';
  return '#667eea';
}

