import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Map, Server, TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/dashboard';

// ── Mock Generators (fallback when API is unavailable) ──────────
function mockStats() {
  return {
    activeUsers: 12450,
    userGrowth: 15,
    tripsPlanned: 8320,
    tripGrowth: 22,
    uptime: '99.99%',
    uptimeStatus: 'Stable'
  };
}

function mockGrowth(days) {
  const labels = [];
  const newUsers = [];
  const returningUsers = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    newUsers.push(Math.floor(Math.random() * 40) + 5);
    returningUsers.push(Math.floor(Math.random() * 25) + 3);
  }
  return { labels, newUsers, returningUsers };
}

function mockDestinations() {
  return [
    { name: 'Tokyo, Japan', bookings: 1245, pct: 32, trend: 'up' },
    { name: 'Paris, France', bookings: 980, pct: 25, trend: 'up' },
    { name: 'Bali, Indonesia', bookings: 850, pct: 22, trend: 'up' },
    { name: 'Rome, Italy', bookings: 720, pct: 13, trend: 'down' },
    { name: 'New York, USA', bookings: 690, pct: 8, trend: 'up' }
  ];
}

// ── Styles ──────────────────────────────────────────────────────
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  // Stat cards grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem'
  },
  statCard: {
    background: '#fff',
    borderRadius: '1.25rem',
    padding: '1.5rem',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  statLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#1e293b',
    lineHeight: 1.1
  },
  statTrend: (positive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: positive ? '#10b981' : '#ef4444',
    marginTop: '0.25rem'
  }),
  statIcon: (bg, color) => ({
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '1rem',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }),

  // Chart + sidebar grid
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.5rem'
  },

  // Chart card
  chartCard: {
    background: '#fff',
    borderRadius: '1.25rem',
    padding: '1.75rem',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '0.75rem'
  },
  chartTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#1e293b'
  },
  pillGroup: {
    display: 'flex',
    gap: '0.35rem',
    background: '#f8fafc',
    borderRadius: '0.5rem',
    padding: '0.2rem'
  },
  pill: (active) => ({
    padding: '0.35rem 0.85rem',
    borderRadius: '0.4rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: active ? '#1e293b' : 'transparent',
    color: active ? '#fff' : '#64748b',
    transition: 'all 0.2s'
  }),
  chartLegend: {
    display: 'flex',
    gap: '1.25rem',
    marginTop: '1rem'
  },
  legendItem: (color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#64748b'
  }),
  legendDot: (color) => ({
    width: '0.6rem',
    height: '0.6rem',
    borderRadius: '50%',
    background: color
  }),

  // Destinations card
  destCard: {
    background: '#fff',
    borderRadius: '1.25rem',
    padding: '1.75rem',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  destTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '1.25rem'
  },
  destItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.85rem 0',
    borderBottom: '1px solid #f8fafc'
  },
  destRank: {
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
    flexShrink: 0,
    marginRight: '0.75rem'
  },
  destName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#334155',
    flex: 1
  },
  destStats: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  destBookings: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#1e293b'
  },
  destPct: (trend) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: trend === 'up' ? '#10b981' : '#ef4444'
  }),
  destBar: (pct) => ({
    height: '0.3rem',
    borderRadius: '0.15rem',
    background: '#f1f5f9',
    marginTop: '0.5rem',
    overflow: 'hidden',
    width: '100%'
  }),
  destBarFill: (pct, idx) => ({
    height: '100%',
    borderRadius: '0.15rem',
    width: `${pct}%`,
    background: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'][idx] || '#6366f1',
    transition: 'width 0.6s ease'
  }),

  // Toolbar
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#1e293b'
  },
  refreshRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.6rem',
    border: '1px solid #e2e8f0',
    background: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  lastUpdated: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem'
  }
};

const rankColors = [
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#e0e7ff', color: '#4f46e5' },
  { bg: '#fce7f3', color: '#db2777' },
  { bg: '#ecfdf5', color: '#059669' },
  { bg: '#f1f5f9', color: '#475569' }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [destinations, setDestinations] = useState(null);
  const [days, setDays] = useState(7);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stats`, { headers });
      if (res.ok) return await res.json();
      if (res.status === 403) return { forbidden: true };
    } catch {}
    return mockStats();
  }, []);

  const fetchGrowth = useCallback(async (d) => {
    try {
      const res = await fetch(`${API}/growth?days=${d}`, { headers });
      if (res.ok) return await res.json();
      if (res.status === 403) return { forbidden: true };
    } catch {}
    return mockGrowth(d);
  }, []);

  const fetchDestinations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/top-destinations`, { headers });
      if (res.ok) return await res.json();
      if (res.status === 403) return { forbidden: true };
    } catch {}
    return mockDestinations();
  }, []);

  const fetchAll = useCallback(async (selectedDays) => {
    const d = selectedDays ?? days;
    const [s, g, dest] = await Promise.all([
      fetchStats(),
      fetchGrowth(d),
      fetchDestinations()
    ]);
    setStats(s);
    setGrowth(g);
    setDestinations(dest);
    setLastUpdated(new Date());
  }, [days, fetchStats, fetchGrowth, fetchDestinations]);

  // Initial load + polling every 60s
  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(() => fetchAll(), 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Re-fetch growth when days change
  useEffect(() => {
    (async () => {
      const g = await fetchGrowth(days);
      if (!g?.forbidden) {
        setGrowth(g);
      }
    })();
  }, [days, fetchGrowth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll(days);
    setRefreshing(false);
  };

  const handleDaysChange = (d) => {
    setDays(d);
  };

  // ── Chart config ──────────────────────────────────────────────
  const chartData = growth ? {
    labels: growth.labels,
    datasets: [
      {
        label: 'New Users',
        data: growth.newUsers,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5
      },
      {
        label: 'Trips Created',
        data: growth.returningUsers,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, weight: '500' },
          color: '#94a3b8',
          maxRotation: 45
        },
        border: { display: false }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 11, weight: '500' },
          color: '#94a3b8',
          padding: 8
        },
        border: { display: false },
        beginAtZero: true
      }
    }
  };

  // ── Forbidden state ───────────────────────────────────────────
  if (stats?.forbidden || growth?.forbidden || destinations?.forbidden) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', textAlign: 'center' }}>
        <div style={{ background: '#fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
          <Users size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: '#64748b', maxWidth: '300px' }}>You need administrator privileges to view this dashboard.</p>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────
  if (!stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      trend: stats.userGrowth,
      icon: Users,
      bg: '#ede9fe',
      color: '#7c3aed'
    },
    {
      label: 'Trips Planned',
      value: stats.tripsPlanned.toLocaleString(),
      trend: stats.tripGrowth,
      icon: Map,
      bg: '#d1fae5',
      color: '#059669'
    },
    {
      label: 'System Uptime',
      value: stats.uptime,
      trend: null,
      trendLabel: stats.uptimeStatus,
      icon: Server,
      bg: '#f1f5f9',
      color: '#475569'
    }
  ];

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <h2 style={styles.pageTitle}>Admin Dashboard</h2>
        <div style={styles.refreshRow}>
          {lastUpdated && (
            <span style={styles.lastUpdated}>
              <Clock size={13} />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              ...styles.refreshBtn,
              opacity: refreshing ? 0.6 : 1
            }}
          >
            <RefreshCw
              size={14}
              style={refreshing ? { animation: 'spin 1s linear infinite' } : {}}
            />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} style={styles.statCard}>
              <div style={styles.statInfo}>
                <span style={styles.statLabel}>{card.label}</span>
                <span style={styles.statValue}>{card.value}</span>
                {card.trend !== null ? (
                  <span style={styles.statTrend(card.trend >= 0)}>
                    {card.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {card.trend >= 0 ? '+' : ''}{card.trend}% this month
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginTop: '0.25rem' }}>
                    {card.trendLabel}
                  </span>
                )}
              </div>
              <div style={styles.statIcon(card.bg, card.color)}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div style={styles.chartCard} className="lg:col-span-2 overflow-hidden">
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>User Growth Trends</span>
            <div style={styles.pillGroup}>
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => handleDaysChange(d)}
                  style={styles.pill(days === d)}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '280px', position: 'relative' }}>
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                Loading chart…
              </div>
            )}
          </div>

          <div style={styles.chartLegend}>
            <span style={styles.legendItem('#6366f1')}>
              <span style={styles.legendDot('#6366f1')} /> New Users
            </span>
            <span style={styles.legendItem('#f59e0b')}>
              <span style={styles.legendDot('#f59e0b')} /> Trips Created
            </span>
          </div>
        </div>

        {/* Top Destinations */}
        <div style={styles.destCard}>
          <h3 style={styles.destTitle}>Top Destinations</h3>
          {(destinations || []).map((dest, idx) => (
            <div key={idx}>
              <div style={styles.destItem}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <span
                    style={{
                      ...styles.destRank,
                      background: rankColors[idx]?.bg || '#f1f5f9',
                      color: rankColors[idx]?.color || '#475569'
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={styles.destName}>{dest.name}</span>
                </div>
                <div style={styles.destStats}>
                  <span style={styles.destBookings}>{dest.bookings}</span>
                  <span style={styles.destPct(dest.trend)}>
                    {dest.trend === 'up' ? '↑' : '↓'} {dest.pct}%
                  </span>
                </div>
              </div>
              <div style={styles.destBar(dest.pct)}>
                <div style={styles.destBarFill(dest.pct, idx)} />
              </div>
            </div>
          ))}

          {(!destinations || destinations.length === 0) && (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>
              No destination data yet.
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
