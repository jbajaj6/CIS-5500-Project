import DataCard from './DataCard';

export default function StatsGrid({ stats, loading }) {
    if (loading) {
        return (
            <div className="grid grid-4" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton" style={{ height: '150px' }} />
                ))}
            </div>
        );
    }

    if (!stats || stats.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-4" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            {stats.map((stat, index) => (
                <DataCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    subtitle={stat.subtitle}
                    icon={stat.icon}
                    trend={stat.trend}
                    colorScheme={stat.colorScheme}
                    onClick={stat.onClick}
                />
            ))}
        </div>
    );
}
