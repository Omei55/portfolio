/**
 * User Stories Component
 * Displays all user stories with filtering and sorting functionality
 */

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userStoriesService from "../services/userStoriesService";
import "./UserStories.css";

const UserStories = () => {
  const { user, logout } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [prioritySearch, setPrioritySearch] = useState("");
  const [storyPointsMin, setStoryPointsMin] = useState("");
  const [storyPointsMax, setStoryPointsMax] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'

  // Priority order for sorting
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  const statusOrder = { "To Do": 1, "In Progress": 2, Done: 3 };

  // Fetch stories on component mount and when filters change
  useEffect(() => {
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPriority, storyPointsMin, storyPointsMax, filterStatus]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const filters = {
        priority: filterPriority !== "All" ? filterPriority : undefined,
        status: filterStatus !== "All" ? filterStatus : undefined,
        storyPointsMin: storyPointsMin !== "" ? storyPointsMin : undefined,
        storyPointsMax: storyPointsMax !== "" ? storyPointsMax : undefined,
      };
      const data = await userStoriesService.getAllStories(filters);
      setStories(data);
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort stories
  const filteredAndSortedStories = useMemo(() => {
    let filtered = [...stories];

    // Apply status filter
    if (filterStatus !== "All") {
      filtered = filtered.filter((story) => story.status === filterStatus);
    }

    // All filters (priority, status, story points) are now handled by backend
    // No need for client-side filtering

    // Apply priority search (case-insensitive partial match)
    if (prioritySearch.trim() !== "") {
      filtered = filtered.filter((story) =>
        story.priority?.toLowerCase().includes(prioritySearch.toLowerCase().trim())
      );
    }

    // Apply story points range filter
    if (storyPointsMin !== "" || storyPointsMax !== "") {
      filtered = filtered.filter((story) => {
        const storyPoints = story.storyPoints !== null && story.storyPoints !== undefined 
          ? Number(story.storyPoints) 
          : null;
        
        if (storyPoints === null) {
          // If story has no story points, exclude it from range filter
          return false;
        }

        const min = storyPointsMin !== "" ? Number(storyPointsMin) : -Infinity;
        const max = storyPointsMax !== "" ? Number(storyPointsMax) : Infinity;

        // Check if min is valid number
        if (storyPointsMin !== "" && (isNaN(min) || min < 0)) {
          return true; // Don't filter out if min is invalid
        }

        // Check if max is valid number
        if (storyPointsMax !== "" && (isNaN(max) || max < 0)) {
          return true; // Don't filter out if max is invalid
        }

        return storyPoints >= min && storyPoints <= max;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "priority":
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case "storyPoints":
          aValue = a.storyPoints || 0;
          bValue = b.storyPoints || 0;
          break;
        case "status":
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stories, filterStatus, filterPriority, prioritySearch, storyPointsMin, storyPointsMax, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      "To Do": "status-todo",
      "In Progress": "status-progress",
      Done: "status-done",
    };
    return statusMap[status] || "";
  };

  const getPriorityClass = (priority) => {
    const priorityMap = {
      High: "priority-high",
      Medium: "priority-medium",
      Low: "priority-low",
    };
    return priorityMap[priority] || "";
  };

  const handleLogout = () => {
    logout();
  };

  // Get unique values for filters
  const uniqueStatuses = ["All", ...new Set(stories.map((s) => s.status))];
  const uniquePriorities = ["All", ...new Set(stories.map((s) => s.priority))];

  if (loading) {
    return (
      <div className="user-stories-container">
        <div className="loading">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="user-stories-container">
      <header className="stories-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/dashboard" className="back-link">
              ← Dashboard
            </Link>
            <h1>User Stories</h1>
          </div>
          <div className="user-section">
            <span className="user-name">
              {user?.fullName || user?.email || "User"}
            </span>
            <span className="user-role">
              {Array.isArray(user?.roles) && user.roles.length > 0
                ? user.roles[0]
                : "Member"}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="stories-main">
        <div className="stories-controls">
          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="status-filter">Filter by Status:</label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="priority-filter">Filter by Priority:</label>
              <select
                id="priority-filter"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="filter-select"
              >
                {uniquePriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="priority-search">Search Priority:</label>
              <input
                id="priority-search"
                type="text"
                placeholder="Type to search..."
                value={prioritySearch}
                onChange={(e) => setPrioritySearch(e.target.value)}
                className="filter-input"
              />
              {prioritySearch && (
                <button
                  className="clear-filter-btn"
                  onClick={() => setPrioritySearch("")}
                  title="Clear priority search"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="filter-group filter-group-range">
              <label htmlFor="story-points-range">Story Points Range:</label>
              <div className="range-inputs">
                <input
                  id="story-points-min"
                  type="number"
                  placeholder="Min"
                  min="0"
                  value={storyPointsMin}
                  onChange={(e) => setStoryPointsMin(e.target.value)}
                  className="filter-input range-input"
                />
                <span className="range-separator">-</span>
                <input
                  id="story-points-max"
                  type="number"
                  placeholder="Max"
                  min="0"
                  value={storyPointsMax}
                  onChange={(e) => setStoryPointsMax(e.target.value)}
                  className="filter-input range-input"
                />
              </div>
              {(storyPointsMin !== "" || storyPointsMax !== "") && (
                <button
                  className="clear-filter-btn"
                  onClick={() => {
                    setStoryPointsMin("");
                    setStoryPointsMax("");
                  }}
                  title="Clear story points filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="view-controls">
            <div className="view-toggle">
              <button
                className={viewMode === "table" ? "active" : ""}
                onClick={() => setViewMode("table")}
              >
                Table
              </button>
              <button
                className={viewMode === "card" ? "active" : ""}
                onClick={() => setViewMode("card")}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        <div className="stories-summary">
          <p>
            Showing <strong>{filteredAndSortedStories.length}</strong> of{" "}
            <strong>{stories.length}</strong> stories
          </p>
        </div>

        {viewMode === "table" ? (
          <div className="stories-table-container">
            <table className="stories-table">
              <thead>
                <tr>
                  <th
                    className={
                      sortBy === "title" ? `sortable ${sortOrder}` : "sortable"
                    }
                    onClick={() => handleSort("title")}
                  >
                    Title{" "}
                    {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className={
                      sortBy === "priority"
                        ? `sortable ${sortOrder}`
                        : "sortable"
                    }
                    onClick={() => handleSort("priority")}
                  >
                    Priority{" "}
                    {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className={
                      sortBy === "storyPoints"
                        ? `sortable ${sortOrder}`
                        : "sortable"
                    }
                    onClick={() => handleSort("storyPoints")}
                  >
                    Story Points{" "}
                    {sortBy === "storyPoints" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className={
                      sortBy === "status" ? `sortable ${sortOrder}` : "sortable"
                    }
                    onClick={() => handleSort("status")}
                  >
                    Status{" "}
                    {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">
                      No stories found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStories.map((story) => (
                    <tr key={story.id}>
                      <td className="story-title">{story.title}</td>
                      <td>
                        <span
                          className={`priority-badge ${getPriorityClass(
                            story.priority
                          )}`}
                        >
                          {story.priority}
                        </span>
                      </td>
                      <td className="story-points">{story.storyPoints}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            story.status
                          )}`}
                        >
                          {story.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="stories-cards-container">
            {filteredAndSortedStories.length === 0 ? (
              <div className="no-data-card">
                No stories found matching the current filters.
              </div>
            ) : (
              <div className="stories-grid">
                {filteredAndSortedStories.map((story) => (
                  <div key={story.id} className="story-card">
                    <h3 className="story-card-title">{story.title}</h3>
                    <div className="story-card-details">
                      <div className="story-card-item">
                        <span className="label">Priority:</span>
                        <span
                          className={`priority-badge ${getPriorityClass(
                            story.priority
                          )}`}
                        >
                          {story.priority}
                        </span>
                      </div>
                      <div className="story-card-item">
                        <span className="label">Story Points:</span>
                        <span className="value">{story.storyPoints}</span>
                      </div>
                      <div className="story-card-item">
                        <span className="label">Status:</span>
                        <span
                          className={`status-badge ${getStatusClass(
                            story.status
                          )}`}
                        >
                          {story.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserStories;
