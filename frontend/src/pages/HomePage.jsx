// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';

export default function HomePage() {
  const analysisCategories = [
    {
      title: 'Disease Analysis',
      description: 'Comprehensive disease tracking and case analysis',
      icon: '📊',
      colorScheme: 'purple',
      features: [
        { name: 'State Top Diseases', path: '/state-top-diseases', icon: '🏆' },
        { name: 'Weekly Case Rates', path: '/weekly-rates', icon: '📅' },
        { name: 'Yearly Case Rates', path: '/yearly-rates', icon: '📈' },
        { name: 'Statistical Outliers', path: '/outliers', icon: '📍' },
        { name: 'State vs National Trends', path: '/trend-comparison', icon: '🔄' },
      ],
    },
    {
      title: 'Demographics',
      description: 'Population-level analyses and health disparities',
      icon: '👥',
      colorScheme: 'blue',
      features: [
        { name: 'Demographic Cases', path: '/demographic-cases', icon: '👤' },
        { name: 'Disparity Analysis', path: '/disparity-analysis', icon: '⚖️' },
        { name: 'Deaths by Demographics', path: '/deaths-analysis', icon: '💔' },
        { name: 'Low Risk States', path: '/low-risk-states', icon: '✅' },
      ],
    },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1c2e 0%, #302b63 100%)',
        padding: '6rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 'var(--spacing-2xl)',
        borderRadius: '0 0 50px 50px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(118, 75, 162, 0.2) 0%, transparent 50%)',
          animation: 'pulse 4s infinite ease-in-out',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: '800',
            marginBottom: 'var(--spacing-lg)',
            background: 'linear-gradient(to right, #fff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            Advanced Disease Analytics Platform
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-xl)',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto var(--spacing-xl)',
          }}>
            Explore comprehensive epidemiological data with interactive visualizations.
            Track trends, identify outliers, and analyze demographic disparities across the nation.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--spacing-lg)',
            maxWidth: '800px',
            margin: '0 auto var(--spacing-xl)',
          }}>
            <QuickStat value="50+" label="States Tracked" icon="🗺️" />
            <QuickStat value="100+" label="Diseases Monitored" icon="🦠" />
            <QuickStat value="10+" label="Analysis Tools" icon="🔬" />
            <QuickStat value="2025" label="Latest Data" icon="📅" />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="btn-primary"
              style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            >
              Start Analysis
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
              onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Categories */}
      <div className="page-container">
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-2xl)',
          marginTop: 'var(--spacing-2xl)',
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)', color: '#1a1c2e' }}>
            Explore the Data
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#2d3748',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Choose an analysis category to dive into comprehensive disease tracking
            and demographic insights
          </p>
        </div>

        <div className="grid grid-2">
          {analysisCategories.map((category, idx) => (
            <CategoryCard key={idx} {...category} />
          ))}
        </div>

        {/* About Section */}
        <div className="card" style={{
          marginTop: 'var(--spacing-2xl)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
        }}>
          <h3 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-md)', color: '#1a1c2e' }}>
            About This Platform
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
            <div>
              <h4 style={{ color: '#4c51bf', marginBottom: 'var(--spacing-sm)' }}>Data Sources</h4>
              <ul style={{ color: '#2d3748', lineHeight: 1.8, listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>• CDC NNDSS - Weekly Disease Data</li>
                <li style={{ marginBottom: '0.5rem' }}>• SEER Population Demographics</li>
                <li style={{ marginBottom: '0.5rem' }}>• NHANES Infectious Disease Prevalence</li>
                <li style={{ marginBottom: '0.5rem' }}>• COVID-19, Flu, and RSV Death Statistics</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#4c51bf', marginBottom: 'var(--spacing-sm)' }}>Key Features</h4>
              <ul style={{ color: '#2d3748', lineHeight: 1.8, listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>• Real-time disease surveillance tracking</li>
                <li style={{ marginBottom: '0.5rem' }}>• Demographic disparity analysis</li>
                <li style={{ marginBottom: '0.5rem' }}>• Multi-year trend identification</li>
                <li style={{ marginBottom: '0.5rem' }}>• State-level comparative analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

function QuickStat({ value, label, icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      padding: 'var(--spacing-lg)',
      borderRadius: 'var(--border-radius)',
      border: '1px solid rgba(255,255,255,0.2)',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>{icon}</div>
      <div style={{
        fontSize: '1.75rem',
        fontWeight: '700',
        color: 'white',
        marginBottom: 'var(--spacing-xs)',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
        {label}
      </div>
    </div>
  );
}

function CategoryCard({ title, description, icon, colorScheme, features }) {
  const gradients = {
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  };

  return (
    <div className="card" style={{ padding: 'var(--spacing-xl)', background: 'rgba(30, 33, 58, 0.6)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: gradients[colorScheme],
          borderRadius: 'var(--border-radius)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#ffffff' }}>{title}</h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.875rem',
            marginBottom: 0,
          }}>
            {description}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {features.map((feature, idx) => (
          <Link
            key={idx}
            to={feature.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              background: 'rgba(102, 126, 234, 0.15)',
              borderRadius: 'var(--border-radius-sm)',
              textDecoration: 'none',
              color: '#ffffff',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(102, 126, 234, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.color = '#ffffff';
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{feature.icon}</span>
            <span style={{ fontWeight: '600', color: '#ffffff' }}>{feature.name}</span>
            <span style={{ marginLeft: 'auto', color: 'rgba(255, 255, 255, 0.8)' }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
