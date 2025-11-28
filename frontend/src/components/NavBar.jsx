// src/components/NavBar.jsx
import { Link } from "react-router-dom";
import { useState } from "react";

export default function NavBar() {
  const [showAnalysisMenu, setShowAnalysisMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            🦠
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ background: 'linear-gradient(45deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem', fontWeight: '800' }}>
                DiseaseTracker
              </span>
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
            }}>
              National Health Analytics
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link
            to="/"
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.color = '#667eea'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.9)'}
          >
            Dashboard
          </Link>

          {/* Analysis Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowAnalysisMenu(true)}
            onMouseLeave={() => setShowAnalysisMenu(false)}
          >
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Disease Analysis
              <span style={{ fontSize: '0.75rem' }}>▼</span>
            </button>

            {showAnalysisMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                paddingTop: '0.5rem',
                zIndex: 1000,
              }}>
                <div style={{
                  background: 'rgba(10, 14, 39, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  minWidth: '220px',
                  padding: '0.5rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}>
                  <NavDropdownLink to="/top-disease">Top States by Disease</NavDropdownLink>
                  <NavDropdownLink to="/weekly-rates">Weekly Case Rates</NavDropdownLink>
                  <NavDropdownLink to="/yearly-rates">Yearly Case Rates</NavDropdownLink>
                  <NavDropdownLink to="/rising-trends">Rising Trends</NavDropdownLink>
                  <NavDropdownLink to="/outliers">Statistical Outliers</NavDropdownLink>
                  <NavDropdownLink to="/trend-comparison">State vs National</NavDropdownLink>
                </div>
              </div>
            )}
          </div>

          {/* Demographics Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowDemoMenu(true)}
            onMouseLeave={() => setShowDemoMenu(false)}
          >
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Demographics
              <span style={{ fontSize: '0.75rem' }}>▼</span>
            </button>

            {showDemoMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                paddingTop: '0.5rem',
                zIndex: 1000,
              }}>
                <div style={{
                  background: 'rgba(10, 14, 39, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  minWidth: '220px',
                  padding: '0.5rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}>
                  <NavDropdownLink to="/demographic-cases">Demographic Cases</NavDropdownLink>
                  <NavDropdownLink to="/disparity-analysis">Disparity Analysis</NavDropdownLink>
                  <NavDropdownLink to="/deaths-analysis">Deaths by Demographics</NavDropdownLink>
                  <NavDropdownLink to="/low-risk-states">Low Risk States</NavDropdownLink>
                </div>
              </div>
            )}
          </div>
        </div>
      </div >
    </nav >
  );
}

// Helper component for dropdown links
function NavDropdownLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '0.75rem 1rem',
        color: 'rgba(255, 255, 255, 0.8)',
        textDecoration: 'none',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        fontSize: '0.95rem',
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(102, 126, 234, 0.2)';
        e.target.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'transparent';
        e.target.style.color = 'rgba(255, 255, 255, 0.8)';
      }}
    >
      {children}
    </Link>
  );
}
