import React, { useState, useEffect } from 'react';
import { PieChart, AlertCircle, Download } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import './pointBreakdown.css';

const PointBreakdown = ({ userId = null }) => {
  const [breakdown, setBreakdown] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('pie'); // pie or bar

  const currentUserId = userId || localStorage.getItem('userId');

  useEffect(() => {
    if (currentUserId) {
      fetchBreakdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const fetchBreakdown = async () => {
    if (!currentUserId) {
      setError('User not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/poin/breakdown/${currentUserId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch breakdown: ${response.status}`);
      }

      const data = await response.json();

      const breakdownData = data.data || [];
      setBreakdown(breakdownData);

      // Calculate total
      const total = breakdownData.reduce((sum, item) => sum + item.total, 0);
      setTotalPoints(total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value) => {
    if (totalPoints === 0) return 0;
    return Math.round((value / totalPoints) * 100);
  };

  const getSourceIcon = (source) => {
    const icons = {
      tabung_sampah: '♻️',
      setor_sampah: '♻️',
      tukar_poin: '🎁',
      bonus: '⭐',
      referral: '👥',
      daily_login: '📅',
      survey: '📝',
      default: '💰',
    };
    return icons[source] || icons.default;
  };

  const getSourceLabel = (source) => {
    const labels = {
      tabung_sampah: 'Tabung Sampah',
      setor_sampah: 'Tabung Sampah',
      tukar_poin: 'Redemptions',
      bonus: 'Bonuses',
      referral: 'Referrals',
      daily_login: 'Daily Login',
      survey: 'Surveys',
    };
    return labels[source] || source;
  };

  const colors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#fee140',
    '#30cfd0',
  ];

  const getColor = (index) => colors[index % colors.length];

  const handleExport = () => {
    const data = breakdown.map(item => ({
      source: getSourceLabel(item.source),
      points: item.total,
      percentage: calculatePercentage(item.total) + '%'
    }));
    
    const csv = [
      ['Source', 'Points', 'Percentage'],
      ...data.map(row => [row.source, row.points, row.percentage])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `points-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!currentUserId) {
    return (
      <div className="point-breakdown error-state">
        <AlertCircle size={32} />
        <p>Please log in to view breakdown</p>
      </div>
    );
  }

  return (
    <div className="point-breakdown-container">
      {/* Header */}
      <div className="breakdown-header">
        <h2>Point Breakdown</h2>
        <div className="header-actions">
          <button className="export-btn" onClick={handleExport} disabled={loading}>
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {loading && breakdown.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading breakdown data...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchBreakdown}>
            Retry
          </button>
        </div>
      ) : breakdown.length === 0 ? (
        <div className="empty-state">
          <PieChart size={32} />
          <p>No point breakdown data</p>
        </div>
      ) : (
        <>
          {/* Chart Section */}
          <div className="chart-section">
            {/* Chart Type Selector */}
            <div className="chart-controls">
              <button
                className={`chart-btn ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
              >
                Pie Chart
              </button>
              <button
                className={`chart-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                Bar Chart
              </button>
            </div>

            {/* Pie Chart */}
            {chartType === 'pie' && (
              <div className="pie-chart-wrapper">
                <svg viewBox="0 0 200 200" className="pie-chart">
                  {breakdown.map((item, index) => {
                    const percentage = calculatePercentage(item.total);
                    const circumference = 2 * Math.PI * 95;
                    const offset = circumference - (percentage / 100) * circumference;
                    const startAngle = breakdown
                      .slice(0, index)
                      .reduce((sum, x) => sum + calculatePercentage(x.total), 0);

                    return (
                      <circle
                        key={index}
                        cx="100"
                        cy="100"
                        r="95"
                        fill="none"
                        stroke={getColor(index)}
                        strokeWidth="30"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{
                          transform: `rotate(${(startAngle / 100) * 360}deg)`,
                          transformOrigin: '100px 100px',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    );
                  })}
                  <circle
                    cx="100"
                    cy="100"
                    r="60"
                    fill="white"
                  />
                  <text
                    x="100"
                    y="100"
                    textAnchor="middle"
                    dy="0.3em"
                    fontSize="24"
                    fontWeight="bold"
                    fill="#333"
                  >
                    {totalPoints}
                  </text>
                  <text
                    x="100"
                    y="120"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#999"
                  >
                    Total Points
                  </text>
                </svg>
              </div>
            )}

            {/* Bar Chart */}
            {chartType === 'bar' && (
              <div className="bar-chart-wrapper">
                <div className="bar-chart">
                  {breakdown.map((item, index) => {
                    const percentage = calculatePercentage(item.total);
                    return (
                      <div key={index} className="bar-item">
                        <div className="bar-label">
                          <span className="bar-icon">{getSourceIcon(item.source)}</span>
                          <span>{getSourceLabel(item.source)}</span>
                        </div>
                        <div className="bar-container">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: getColor(index),
                            }}
                          >
                            <span className="bar-text">{percentage}%</span>
                          </div>
                        </div>
                        <div className="bar-value">{item.total}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Legend and Stats */}
          <div className="breakdown-stats">
            <div className="stats-header">
              <h3>Sources</h3>
              <span className="total-label">Total: {totalPoints.toLocaleString('id-ID')}</span>
            </div>

            <div className="sources-list">
              {breakdown.map((item, index) => (
                <div key={index} className="source-item">
                  <div className="source-left">
                    <div
                      className="source-color"
                      style={{ backgroundColor: getColor(index) }}
                    ></div>
                    <div>
                      <p className="source-name">{getSourceLabel(item.source)}</p>
                      <p className="source-desc">{item.total} points</p>
                    </div>
                  </div>
                  <div className="source-right">
                    <span className="source-percentage">
                      {calculatePercentage(item.total)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PointBreakdown;
