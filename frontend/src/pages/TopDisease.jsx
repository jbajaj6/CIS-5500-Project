// src/pages/TopDisease.jsx
import { useState, useEffect } from 'react';
import config from '../config';
import { safeFetch, formatNumber, formatPer100k } from '../utils';
import FilterPanel from '../components/FilterPanel';
import StatsGrid from '../components/StatsGrid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TopDisease() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ year: 2025 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (filterValues = filters) => {
    setLoading(true);
    setError(null);
    try {
      const year = filterValues.year || 2025;
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

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData(newFilters);
  };

  const getStats = () => {
    if (!data || data.length === 0) return [];

    const totalCases = data.reduce((sum, item) => sum + Number(item.totalCases || 0), 0);
    const avgRate = data.reduce((sum, item) => sum + Number(item.casesPer100k || 0), 0) / data.length;
    const topState = data[0];
    const uniqueDiseases = new Set(data.map(item => item.diseaseName)).size;

    return [
      {
        title: 'Total Cases',
        value: formatNumber(totalCases),
        subtitle: 'Across top 10 states',
        icon: '📊',
        colorScheme: 'purple',
      },
      {
        title: 'Top State',
        value: topState?.stateName || 'N/A',
        subtitle: `${formatPer100k(topState?.casesPer100k)} per 100k`,
        icon: '🏆',
        colorScheme: 'orange',
      },
      {
        title: 'Average Rate',
        value: formatPer100k(avgRate),
        subtitle: 'Per 100k population',
        icon: '📈',
        colorScheme: 'blue',
      },
      {
        title: 'Diseases Tracked',
        value: uniqueDiseases,
        subtitle: 'In top 10',
        icon: '🦠',
        colorScheme: 'green',
      },
    ];
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Top States by Disease Burden</h1>
        <p className="page-subtitle">
          Identifies the 10 states with the highest per-capita disease rates for a given year.
          Higher rates indicate greater disease burden relative to population size.
        </p>
      </div>

      <FilterPanel
        onFilterChange={handleFilterChange}
        filters={{ showState: false, showDisease: false, showWeek: false }}
      />

      {!loading && !error && <StatsGrid stats={getStats()} />}

      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)',
        }}>
          <h3>Top 10 States - {filters.year}</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Showing states with highest cases per 100k population
          </div>
        </div>

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
            No data available for selected year
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Rank</th>
                  <th style={tableHeaderStyle}>State</th>
                  <th style={tableHeaderStyle}>Disease</th>
                  <th style={tableHeaderStyle}>Total Cases</th>
                  <th style={tableHeaderStyle}>Population</th>
                  <th style={tableHeaderStyle}>Cases per 100k</th>
                  <th style={tableHeaderStyle}>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      background: 'var(--bg-card)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <td style={tableCellStyle}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: getRankGradient(index),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        margin: '0 auto',
                      }}>
                        {index + 1}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: '600' }}>{item.stateName}</td>
                    <td style={tableCellStyle}>{item.diseaseName}</td>
                    <td style={{ ...tableCellStyle, fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(item.totalCases)}
                    </td>
                    <td style={{ ...tableCellStyle, fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(item.totalPopulation)}
                    </td>
                    <td style={{
                      ...tableCellStyle,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      color: getRateColor(item.casesPer100k),
                    }}>
                      {formatPer100k(item.casesPer100k)}
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        ...getRiskBadge(item.casesPer100k),
                      }}>
                        {getRiskLevel(item.casesPer100k)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && data.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-xl)', height: '500px' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📊 Visual Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.slice(0, 10)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="var(--text-secondary)" />
              <YAxis
                type="category"
                dataKey="stateName"
                stroke="var(--text-primary)"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                formatter={(value) => [`${formatPer100k(value)} per 100k`, 'Rate']}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="casesPer100k" radius={[0, 4, 4, 0]}>
                {data.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? '#00f2fe' : '#667eea'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
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
};

const tableCellStyle = {
  padding: 'var(--spacing-md)',
  color: 'var(--text-primary)',
};

// Helper functions
function getRankGradient(index) {
  const gradients = [
    'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', // Gold
    'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)', // Silver
    'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', // Bronze
  ];
  return gradients[index] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

function getRateColor(rate) {
  if (rate > 1000) return '#ff0844';
  if (rate > 500) return '#fee140';
  if (rate > 100) return '#00f2fe';
  return 'var(--text-primary)';
}

function getRiskLevel(rate) {
  if (rate > 1000) return 'CRITICAL';
  if (rate > 500) return 'HIGH';
  if (rate > 100) return 'ELEVATED';
  return 'MODERATE';
}

function getRiskBadge(rate) {
  if (rate > 1000) return { background: 'rgba(255, 8, 68, 0.2)', color: '#ff0844' };
  if (rate > 500) return { background: 'rgba(254, 225, 64, 0.2)', color: '#fee140' };
  if (rate > 100) return { background: 'rgba(0, 242, 254, 0.2)', color: '#00f2fe' };
  return { background: 'rgba(102, 126, 234, 0.2)', color: '#667eea' };
}
