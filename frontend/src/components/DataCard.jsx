// src/components/DataCard.jsx
import { formatNumber, formatPer100k, formatPercent } from '../utils';

export default function DataCard({ title, value, subtitle, icon, trend, colorScheme = 'purple', onClick }) {
    const gradients = {
        purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        red: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
        green: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        orange: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    };

    const trendIcons = {
        up: '↑',
        down: '↓',
        stable: '→',
    };

    const trendColors = {
        up: '#ff0844',
        down: '#00f2fe',
        stable: 'rgba(255, 255, 255, 0.5)',
    };

    return (
        <div
            className="card-gradient"
            style={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                }
            }}
            onMouseLeave={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }
            }}
        >
            {/* Gradient top border */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: gradients[colorScheme],
            }} />

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.5rem',
                    }}>
                        {title}
                    </div>

                    <div style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '0.25rem',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        {value}
                    </div>

                    {subtitle && (
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '0.875rem',
                        }}>
                            {subtitle}
                        </div>
                    )}

                    {trend && (
                        <div style={{
                            marginTop: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            color: trendColors[trend.direction] || trendColors.stable,
                            fontWeight: '600',
                        }}>
                            <span style={{ fontSize: '1.25rem' }}>
                                {trendIcons[trend.direction] || trendIcons.stable}
                            </span>
                            <span>{trend.label}</span>
                        </div>
                    )}
                </div>

                {icon && (
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: gradients[colorScheme],
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        flexShrink: 0,
                    }}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
