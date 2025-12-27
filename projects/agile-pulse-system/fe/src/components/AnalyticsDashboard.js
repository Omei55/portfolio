/**
 * Analytics Dashboard Component
 * Displays comprehensive analytics for sprints and stories
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import analyticsService from "../services/analyticsService";
import "./AnalyticsDashboard.css";

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [overallAnalytics, setOverallAnalytics] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [sprintAnalytics, setSprintAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overall"); // 'overall', 'sprint', 'stories'

  useEffect(() => {
    loadOverallAnalytics();
  }, []);

  useEffect(() => {
    if (selectedSprint && activeTab === "sprint") {
      loadSprintAnalytics(selectedSprint);
    }
  }, [selectedSprint, activeTab]);

  const loadOverallAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getOverallAnalytics();
      
      // Normalize dates in sprint analytics to handle Date objects or strings
      if (data && data.sprintAnalytics && Array.isArray(data.sprintAnalytics)) {
        data.sprintAnalytics = data.sprintAnalytics.map((sprint) => {
          // Ensure dates are strings (not Date objects)
          const normalizeDate = (date) => {
            if (!date) return null;
            if (date instanceof Date) return date.toISOString();
            if (typeof date === 'string') return date;
            return null;
          };
          
          return {
            ...sprint,
            startDate: normalizeDate(sprint.startDate),
            endDate: normalizeDate(sprint.endDate),
          };
        });
      }
      
      setOverallAnalytics(data);
      if (data.sprintAnalytics && data.sprintAnalytics.length > 0) {
        setSelectedSprint(data.sprintAnalytics[0].sprintName);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const loadSprintAnalytics = async (sprintName) => {
    try {
      setError(null);
      const data = await analyticsService.getSprintAnalytics(sprintName);
      
      // Normalize dates to handle Date objects or strings
      if (data) {
        const normalizeDate = (date) => {
          if (!date) return null;
          if (date instanceof Date) return date.toISOString();
          if (typeof date === 'string') return date;
          return null;
        };
        
        data.startDate = normalizeDate(data.startDate);
        data.endDate = normalizeDate(data.endDate);
        
        // Also normalize dates in burndown data if present
        if (data.burndownData && Array.isArray(data.burndownData)) {
          data.burndownData = data.burndownData.map((point) => ({
            ...point,
            date: normalizeDate(point.date) || point.date,
          }));
        }
      }
      
      setSprintAnalytics(data);
    } catch (err) {
      console.error("Failed to load sprint analytics:", err);
      setError(err.message || "Failed to load sprint analytics");
    }
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
          <button onClick={loadOverallAnalytics} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overallAnalytics) {
    return (
      <div className="analytics-dashboard">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "overall" ? "active" : ""}`}
            onClick={() => setActiveTab("overall")}
          >
            Overall
          </button>
          <button
            className={`tab-button ${activeTab === "sprint" ? "active" : ""}`}
            onClick={() => setActiveTab("sprint")}
          >
            Sprint Details
          </button>
          <button
            className={`tab-button ${activeTab === "stories" ? "active" : ""}`}
            onClick={() => setActiveTab("stories")}
          >
            Story Analytics
          </button>
        </div>
      </div>

      {activeTab === "overall" && (
        <OverallAnalyticsView analytics={overallAnalytics} />
      )}

      {activeTab === "sprint" && (
        <SprintAnalyticsView
          overallAnalytics={overallAnalytics}
          selectedSprint={selectedSprint}
          setSelectedSprint={setSelectedSprint}
          sprintAnalytics={sprintAnalytics}
          loading={!sprintAnalytics}
        />
      )}

      {activeTab === "stories" && (
        <StoryAnalyticsView analytics={overallAnalytics.storyAnalytics} />
      )}
    </div>
  );
};

const OverallAnalyticsView = ({ analytics }) => {
  // Prepare data for charts
  const storyCountsData = {
    total: analytics.totalStories,
    mvp: analytics.mvpStories || 0,
    sprintReady: analytics.sprintReadyStories || 0,
  };

  return (
    <div className="overall-analytics">
      <div className="metrics-grid">
        <MetricCard
          title="Total Sprints"
          value={analytics.totalSprints}
          subtitle={`${analytics.activeSprints} active, ${analytics.completedSprints} completed`}
        />
        <MetricCard
          title="Total Stories"
          value={analytics.totalStories}
          subtitle={`${analytics.completedStories} completed, ${analytics.inProgressStories} in progress`}
        />
        <MetricCard
          title="MVP Stories"
          value={analytics.mvpStories || 0}
          subtitle="Critical or High priority"
        />
        <MetricCard
          title="Sprint-Ready Stories"
          value={analytics.sprintReadyStories || 0}
          subtitle="Ready for sprint planning"
        />
        <MetricCard
          title="Completion Rate"
          value={`${analytics.overallCompletionRate.toFixed(1)}%`}
          subtitle={`${analytics.completedStories} of ${analytics.totalStories} stories`}
        />
        <MetricCard
          title="Average Velocity"
          value={analytics.averageSprintVelocity.toFixed(1)}
          subtitle="Story points per sprint"
        />
        <MetricCard
          title="Total Story Points"
          value={analytics.totalStoryPoints}
          subtitle={`${analytics.completedStoryPoints} completed`}
        />
        <MetricCard
          title="Story Distribution"
          value=""
          subtitle={
            <div className="status-breakdown">
              <span>To Do: {analytics.todoStories}</span>
              <span>In Progress: {analytics.inProgressStories}</span>
              <span>Done: {analytics.completedStories}</span>
            </div>
          }
        />
      </div>

      {/* Story Counts Charts Section */}
      <div className="charts-section">
        <h2>Story Counts Visualization</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Story Counts - Bar Chart</h3>
            <BarChart data={storyCountsData} />
          </div>
          <div className="chart-card">
            <h3>Story Counts - Pie Chart</h3>
            <PieChart data={storyCountsData} />
          </div>
        </div>
      </div>

      {analytics.trends && (
        <div className="trends-section">
          <h2>Trends</h2>
          <div className="trends-grid">
            {analytics.trends.sprintVelocityTrend &&
              analytics.trends.sprintVelocityTrend.length > 0 && (
                <div className="trend-card">
                  <h3>Sprint Velocity Trend</h3>
                  <div className="velocity-trend">
                    {analytics.trends.sprintVelocityTrend.map((point, idx) => (
                      <div key={idx} className="velocity-point">
                        <div className="velocity-bar">
                          <div
                            className="velocity-fill"
                            style={{
                              height: `${
                                (point.velocity /
                                  Math.max(
                                    ...analytics.trends.sprintVelocityTrend.map(
                                      (p) => p.velocity
                                    )
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="velocity-label">{point.velocity}</span>
                        <span className="velocity-sprint">
                          {point.sprintName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {analytics.trends.storyCreationTrend &&
              analytics.trends.storyCreationTrend.length > 0 && (
                <div className="trend-card">
                  <h3>Story Creation Trend (Last 30 Days)</h3>
                  <div className="creation-trend">
                    {analytics.trends.storyCreationTrend.map((point, idx) => (
                      <div key={idx} className="creation-point">
                        <div className="creation-bar">
                          <div
                            className="creation-fill"
                            style={{
                              height: `${
                                (point.count /
                                  Math.max(
                                    ...analytics.trends.storyCreationTrend.map(
                                      (p) => p.count
                                    ),
                                    1
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="creation-count">{point.count}</span>
                        <span className="creation-date">
                          {new Date(point.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

const SprintAnalyticsView = ({
  overallAnalytics,
  selectedSprint,
  setSelectedSprint,
  sprintAnalytics,
  loading,
}) => {
  return (
    <div className="sprint-analytics-view">
      <div className="sprint-selector">
        <label htmlFor="sprint-select">Select Sprint:</label>
        <select
          id="sprint-select"
          value={selectedSprint || ""}
          onChange={(e) => setSelectedSprint(e.target.value)}
        >
          {overallAnalytics.sprintAnalytics.map((sprint) => (
            <option key={sprint.sprintName} value={sprint.sprintName}>
              {sprint.sprintName}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading sprint analytics...</p>
        </div>
      ) : sprintAnalytics ? (
        <div className="sprint-details">
          <div className="sprint-header">
            <h2>{sprintAnalytics.sprintName}</h2>
            {sprintAnalytics.startDate && sprintAnalytics.endDate && (
              <p className="sprint-dates">
                {new Date(sprintAnalytics.startDate).toLocaleDateString()} -{" "}
                {new Date(sprintAnalytics.endDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="metrics-grid">
            <MetricCard
              title="Total Stories"
              value={sprintAnalytics.totalStories}
              subtitle={`${sprintAnalytics.completedStories} completed`}
            />
            <MetricCard
              title="Total Story Points"
              value={sprintAnalytics.totalStoryPoints}
              subtitle={`${sprintAnalytics.completedStoryPoints} completed`}
            />
            <MetricCard
              title="Completion Rate"
              value={`${sprintAnalytics.completionRate.toFixed(1)}%`}
              subtitle={`${sprintAnalytics.completedStories} of ${sprintAnalytics.totalStories} stories`}
            />
            <MetricCard
              title="Velocity"
              value={sprintAnalytics.velocity}
              subtitle="Story points completed"
            />
            <MetricCard
              title="Average Story Points"
              value={sprintAnalytics.averageStoryPoints.toFixed(1)}
              subtitle="Per story"
            />
            {sprintAnalytics.daysRemaining !== undefined && (
              <MetricCard
                title="Days Remaining"
                value={sprintAnalytics.daysRemaining}
                subtitle={`${sprintAnalytics.sprintProgress.toFixed(
                  1
                )}% complete`}
              />
            )}
          </div>

          <div className="breakdown-section">
            <div className="breakdown-card">
              <h3>Stories by Status</h3>
              <div className="breakdown-list">
                {Object.entries(sprintAnalytics.storiesByStatus).map(
                  ([status, count]) => (
                    <div key={status} className="breakdown-item">
                      <span className="breakdown-label">{status}:</span>
                      <span className="breakdown-value">{count}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="breakdown-card">
              <h3>Stories by Priority</h3>
              <div className="breakdown-list">
                {Object.entries(sprintAnalytics.storiesByPriority).map(
                  ([priority, count]) => (
                    <div key={priority} className="breakdown-item">
                      <span className="breakdown-label">{priority}:</span>
                      <span className="breakdown-value">{count}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {Object.keys(sprintAnalytics.storiesByAssignee).length > 0 && (
              <div className="breakdown-card">
                <h3>Stories by Assignee</h3>
                <div className="breakdown-list">
                  {Object.entries(sprintAnalytics.storiesByAssignee).map(
                    ([assignee, count]) => (
                      <div key={assignee} className="breakdown-item">
                        <span className="breakdown-label">{assignee}:</span>
                        <span className="breakdown-value">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {sprintAnalytics.burndownData &&
            sprintAnalytics.burndownData.length > 0 && (
              <div className="burndown-section">
                <h3>Sprint Burndown</h3>
                <div className="burndown-chart">
                  <div className="burndown-legend">
                    <span className="legend-item">
                      <span className="legend-color ideal"></span>
                      Ideal
                    </span>
                    <span className="legend-item">
                      <span className="legend-color actual"></span>
                      Actual
                    </span>
                  </div>
                  <div className="burndown-graph">
                    {sprintAnalytics.burndownData.map((point, idx) => {
                      const maxPoints = Math.max(
                        ...sprintAnalytics.burndownData.map((p) =>
                          Math.max(p.remainingPoints, p.idealRemaining)
                        )
                      );
                      return (
                        <div key={idx} className="burndown-point">
                          <div className="burndown-bars">
                            <div
                              className="burndown-bar ideal-bar"
                              style={{
                                height: `${
                                  (point.idealRemaining / maxPoints) * 100
                                }%`,
                              }}
                            ></div>
                            <div
                              className="burndown-bar actual-bar"
                              style={{
                                height: `${
                                  (point.remainingPoints / maxPoints) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="burndown-date">
                            {new Date(point.date).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
        </div>
      ) : (
        <p>No sprint selected</p>
      )}
    </div>
  );
};

const StoryAnalyticsView = ({ analytics }) => {
  if (!analytics) {
    return <p>No story analytics available</p>;
  }

  // Prepare data for charts
  const storyCountsData = {
    total: analytics.totalStories,
    mvp: analytics.mvpStories || 0,
    sprintReady: analytics.sprintReadyStories || 0,
  };

  return (
    <div className="story-analytics-view">
      <div className="metrics-grid">
        <MetricCard
          title="Total Stories"
          value={analytics.totalStories}
          subtitle={`${analytics.unassignedStories} unassigned`}
        />
        <MetricCard
          title="MVP Stories"
          value={analytics.mvpStories || 0}
          subtitle="Critical or High priority"
        />
        <MetricCard
          title="Sprint-Ready Stories"
          value={analytics.sprintReadyStories || 0}
          subtitle="Ready for sprint planning"
        />
        <MetricCard
          title="Total Story Points"
          value={analytics.totalStoryPoints}
          subtitle={`Average: ${analytics.averageStoryPoints}`}
        />
        <MetricCard
          title="Recent Stories"
          value={analytics.recentStories}
          subtitle="Created in last 7 days"
        />
        <MetricCard
          title="Value/Effort Ratio"
          value={analytics.valueEffortRatio.toFixed(2)}
          subtitle={`Avg Value: ${analytics.averageValue}, Avg Effort: ${analytics.averageEffort}`}
        />
      </div>

      {/* Story Counts Charts Section */}
      <div className="charts-section">
        <h2>Story Counts Visualization</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Story Counts - Bar Chart</h3>
            <BarChart data={storyCountsData} />
          </div>
          <div className="chart-card">
            <h3>Story Counts - Pie Chart</h3>
            <PieChart data={storyCountsData} />
          </div>
        </div>
      </div>

      <div className="breakdown-section">
        <div className="breakdown-card">
          <h3>Stories by Status</h3>
          <div className="breakdown-list">
            {Object.entries(analytics.storiesByStatus).map(
              ([status, count]) => (
                <div key={status} className="breakdown-item">
                  <span className="breakdown-label">{status}:</span>
                  <span className="breakdown-value">{count}</span>
                  <div className="breakdown-bar-container">
                    <div
                      className="breakdown-bar"
                      style={{
                        width: `${(count / analytics.totalStories) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="breakdown-card">
          <h3>Stories by Priority</h3>
          <div className="breakdown-list">
            {Object.entries(analytics.storiesByPriority).map(
              ([priority, count]) => (
                <div key={priority} className="breakdown-item">
                  <span className="breakdown-label">{priority}:</span>
                  <span className="breakdown-value">{count}</span>
                  <div className="breakdown-bar-container">
                    <div
                      className="breakdown-bar"
                      style={{
                        width: `${(count / analytics.totalStories) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {Object.keys(analytics.storiesBySprint).length > 0 && (
          <div className="breakdown-card">
            <h3>Stories by Sprint</h3>
            <div className="breakdown-list">
              {Object.entries(analytics.storiesBySprint)
                .sort((a, b) => b[1] - a[1])
                .map(([sprint, count]) => (
                  <div key={sprint} className="breakdown-item">
                    <span className="breakdown-label">{sprint}:</span>
                    <span className="breakdown-value">{count}</span>
                    <div className="breakdown-bar-container">
                      <div
                        className="breakdown-bar"
                        style={{
                          width: `${(count / analytics.totalStories) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {Object.keys(analytics.storiesByAssignee).length > 0 && (
          <div className="breakdown-card">
            <h3>Stories by Assignee</h3>
            <div className="breakdown-list">
              {Object.entries(analytics.storiesByAssignee)
                .sort((a, b) => b[1] - a[1])
                .map(([assignee, count]) => (
                  <div key={assignee} className="breakdown-item">
                    <span className="breakdown-label">{assignee}:</span>
                    <span className="breakdown-value">{count}</span>
                    <div className="breakdown-bar-container">
                      <div
                        className="breakdown-bar"
                        style={{
                          width: `${(count / analytics.totalStories) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {Object.keys(analytics.storiesByEpic).length > 0 && (
          <div className="breakdown-card">
            <h3>Stories by Epic</h3>
            <div className="breakdown-list">
              {Object.entries(analytics.storiesByEpic)
                .sort((a, b) => b[1] - a[1])
                .map(([epic, count]) => (
                  <div key={epic} className="breakdown-item">
                    <span className="breakdown-label">{epic}:</span>
                    <span className="breakdown-value">{count}</span>
                    <div className="breakdown-bar-container">
                      <div
                        className="breakdown-bar"
                        style={{
                          width: `${(count / analytics.totalStories) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BarChart = ({ data }) => {
  const maxValue = Math.max(data.total, data.mvp, data.sprintReady, 1);
  const chartData = [
    { label: "Total Stories", value: data.total, color: "#3182ce" },
    { label: "MVP Stories", value: data.mvp, color: "#ed8936" },
    {
      label: "Sprint-Ready Stories",
      value: data.sprintReady,
      color: "#48bb78",
    },
  ];

  return (
    <div className="bar-chart">
      <div className="bar-chart-bars">
        {chartData.map((item, idx) => (
          <div key={idx} className="bar-chart-item">
            <div className="bar-chart-label">{item.label}</div>
            <div className="bar-chart-bar-container">
              <div
                className="bar-chart-bar"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              >
                <span className="bar-chart-value">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PieChart = ({ data }) => {
  const total = data.total || 1;
  const mvpPercentage = (data.mvp / total) * 100;
  const sprintReadyPercentage = (data.sprintReady / total) * 100;
  const otherPercentage = 100 - mvpPercentage - sprintReadyPercentage;

  // Calculate angles for pie slices
  let currentAngle = 0;
  const slices = [
    {
      label: "MVP Stories",
      value: data.mvp,
      percentage: mvpPercentage,
      color: "#ed8936",
      startAngle: currentAngle,
    },
  ];
  currentAngle += (mvpPercentage / 100) * 360;

  slices.push({
    label: "Sprint-Ready Stories",
    value: data.sprintReady,
    percentage: sprintReadyPercentage,
    color: "#48bb78",
    startAngle: currentAngle,
  });
  currentAngle += (sprintReadyPercentage / 100) * 360;

  slices.push({
    label: "Other Stories",
    value: data.total - data.mvp - data.sprintReady,
    percentage: otherPercentage,
    color: "#cbd5e0",
    startAngle: currentAngle,
  });

  // Create SVG path for pie chart
  const createSlicePath = (startAngle, percentage, radius = 80) => {
    const endAngle = startAngle + (percentage / 100) * 360;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);
    const largeArc = percentage > 50 ? 1 : 0;
    return `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="pie-chart">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {slices.map((slice, idx) => (
          <path
            key={idx}
            d={createSlicePath(slice.startAngle, slice.percentage)}
            fill={slice.color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="pie-chart-legend">
        {slices.map((slice, idx) => (
          <div key={idx} className="pie-legend-item">
            <span
              className="pie-legend-color"
              style={{ backgroundColor: slice.color }}
            ></span>
            <span className="pie-legend-label">{slice.label}</span>
            <span className="pie-legend-value">
              {slice.value} ({slice.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle }) => {
  return (
    <div className="metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      {subtitle && (
        <div className="metric-subtitle">
          {typeof subtitle === "string" ? subtitle : subtitle}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
