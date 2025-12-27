import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import sprintService from "../services/sprintService";
import userStoriesService from "../services/userStoriesService";
import "./Analytics.css";

const Analytics = () => {
  const [stories, setStories] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [sprintStories, setSprintStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSprint) {
      loadSprintStories(selectedSprint.name);
    }
  }, [selectedSprint]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storiesData, sprintsData] = await Promise.all([
        userStoriesService.getAllStories(),
        sprintService.getAllSprints(),
      ]);
      setStories(Array.isArray(storiesData) ? storiesData : []);
      setSprints(Array.isArray(sprintsData) ? sprintsData : []);

      // Set the first active sprint as default
      const activeSprints = sprintsData.filter((sprint) => {
        const endDate = sprint.end_date || sprint.endDate;
        const startDate = sprint.start_date || sprint.startDate;

        // Validate dates exist and are valid
        if (!endDate || !startDate) return false;

        const endDateObj = new Date(endDate);
        const startDateObj = new Date(startDate);
        const today = new Date();

        // Check if dates are valid
        if (isNaN(endDateObj.getTime()) || isNaN(startDateObj.getTime())) {
          return false;
        }

        return endDateObj >= today && startDateObj <= today;
      });
      if (activeSprints.length > 0) {
        setSelectedSprint(activeSprints[0]);
      } else if (sprintsData.length > 0) {
        setSelectedSprint(sprintsData[0]);
      }
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSprintStories = async (sprintName) => {
    try {
      const data = await sprintService.getSprintStories(sprintName);
      setSprintStories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading sprint stories:", error);
      setSprintStories([]);
    }
  };

  // Calculate story metrics
  const storyMetrics = useMemo(() => {
    const totalStories = stories.length;
    const mvpStories = stories.filter((story) =>
      ["Critical", "High"].includes(story.priority)
    ).length;

    // Sprint-Ready Stories: stories that are not in a sprint and have required fields
    const sprintReadyStories = stories.filter(
      (story) =>
        !story.sprint &&
        story.priority &&
        story.status &&
        story.status !== "Done"
    ).length;

    return {
      totalStories,
      mvpStories,
      sprintReadyStories,
    };
  }, [stories]);

  // Prepare data for bar chart
  const barChartData = useMemo(() => {
    return [
      {
        name: "Total Stories",
        value: storyMetrics.totalStories,
        color: "#9333ea",
      },
      {
        name: "MVP Stories",
        value: storyMetrics.mvpStories,
        color: "#f97316",
      },
      {
        name: "Sprint-Ready",
        value: storyMetrics.sprintReadyStories,
        color: "#22c55e",
      },
    ];
  }, [storyMetrics]);

  // Prepare data for pie chart
  const pieChartData = useMemo(() => {
    return [
      { name: "MVP Stories", value: storyMetrics.mvpStories },
      {
        name: "Sprint-Ready",
        value: storyMetrics.sprintReadyStories,
      },
      {
        name: "Other Stories",
        value:
          storyMetrics.totalStories -
          storyMetrics.mvpStories -
          storyMetrics.sprintReadyStories,
      },
    ];
  }, [storyMetrics]);

  const COLORS = ["#9333ea", "#f97316", "#22c55e", "#4299e1"];

  // Calculate burndown data
  const burndownData = useMemo(() => {
    if (!selectedSprint || sprintStories.length === 0) {
      return [];
    }

    const startDateStr = selectedSprint.start_date || selectedSprint.startDate;
    const endDateStr = selectedSprint.end_date || selectedSprint.endDate;

    // Validate dates exist
    if (!startDateStr || !endDateStr) {
      return [];
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return [];
    }

    const today = new Date();

    // Calculate total story points at start
    const totalPoints = sprintStories.reduce(
      (sum, story) => sum + (story.story_points || story.storyPoints || 0),
      0
    );

    // Generate data points for each day
    const data = [];
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Calculate ideal burndown (linear)
      const idealRemaining = totalPoints * (1 - i / daysDiff);

      // Calculate actual burndown (stories completed up to this date)
      const actualRemaining = sprintStories.reduce((sum, story) => {
        // Handle both camelCase and snake_case field names
        const storyDate = story.updatedAt
          ? new Date(story.updatedAt)
          : story.updated_at
          ? new Date(story.updated_at)
          : story.createdAt
          ? new Date(story.createdAt)
          : new Date(story.created_at);

        if (story.status === "Done" && storyDate <= currentDate) {
          return sum - (story.story_points || story.storyPoints || 0);
        }
        return sum;
      }, totalPoints);

      data.push({
        date: currentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        ideal: Math.max(0, idealRemaining),
        actual: Math.max(0, actualRemaining),
      });
    }

    return data;
  }, [selectedSprint, sprintStories]);

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2 className="analytics-title">Dashboard Analytics</h2>
        {sprints.length > 0 && (
          <select
            className="sprint-selector"
            value={selectedSprint?.id || ""}
            onChange={(e) => {
              const sprint = sprints.find((s) => s.id === e.target.value);
              setSelectedSprint(sprint || null);
            }}
          >
            {sprints.map((sprint) => {
              const startDate = sprint.start_date || sprint.startDate;
              const endDate = sprint.end_date || sprint.endDate;

              // Safely format dates
              const formatDate = (date) => {
                if (!date) return "N/A";
                const dateObj = new Date(date);
                if (isNaN(dateObj.getTime())) return "Invalid Date";
                return dateObj.toLocaleDateString();
              };

              return (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} ({formatDate(startDate)} - {formatDate(endDate)}
                  )
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Story Metrics Section */}
      <div className="analytics-section">
        <h3 className="section-title">Story Metrics</h3>
        <div className="charts-grid">
          <div className="chart-card">
            <h4 className="chart-title">Story Counts</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#9333ea" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Story Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Burndown Chart Section */}
      {selectedSprint && burndownData.length > 0 && (
        <div className="analytics-section">
          <h3 className="section-title">Sprint Burndown</h3>
          <div className="chart-card">
            <h4 className="chart-title">
              {selectedSprint.name} - Story Points Burndown
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  stroke="#cbd5e0"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Ideal Burndown"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#9333ea"
                  strokeWidth={3}
                  name="Actual Burndown"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!selectedSprint && (
        <div className="analytics-empty">
          <p>No sprints available. Create a sprint to view burndown charts.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
