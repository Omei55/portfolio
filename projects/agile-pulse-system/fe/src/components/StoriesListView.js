import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import userStoriesService from "../services/userStoriesService";
import exportService from "../services/exportService";
import ErrorAlert from "./ErrorAlert";
import ErrorPlaceholder from "./ErrorPlaceholder";
import "./StoriesListView.css";

const StoriesListView = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  
  // Multi-select filter states
  const [statusFilters, setStatusFilters] = useState([]);
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [assigneeFilters, setAssigneeFilters] = useState([]);
  const [storyPointsMin, setStoryPointsMin] = useState("");
  const [storyPointsMax, setStoryPointsMax] = useState("");
  
  // Filter validation errors
  const [filterErrors, setFilterErrors] = useState({});

  // Available filter options
  const availableStatuses = ["To Do", "In Progress", "In Review", "Done"];
  const availablePriorities = ["Critical", "High", "Medium", "Low"];
  
  // Get unique assignees from stories
  const availableAssignees = useMemo(() => {
    const assignees = new Set();
    stories.forEach((story) => {
      if (story.assignee && story.assignee.trim()) {
        assignees.add(story.assignee.trim());
      }
    });
    return Array.from(assignees).sort();
  }, [stories]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedStories, setSelectedStories] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");
  const [exportTarget, setExportTarget] = useState("generic");
  const [successMessage, setSuccessMessage] = useState(null);
  const [prioritySearch, setPrioritySearch] = useState("");

  // Load stories on component mount
  useEffect(() => {
    loadStories();
  }, []);

  // Refresh stories from API when filters change (debounced)
  // Backend handles all filtering, so we reload with new filter params
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filterParams = buildFilterParams();
      loadStories(filterParams);
    }, 300); // Debounce API calls

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilters, priorityFilters, assigneeFilters, storyPointsMin, storyPointsMax]);

  const loadStories = async (filters = null) => {
    setLoading(true);
    setError(null);

    try {
      const filterParams = filters || buildFilterParams();
      // Backend handles all filtering, so returned data is already filtered
      const data = await userStoriesService.getAllStories({ filters: filterParams });
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load stories:", error);
      setError(error.message || "Failed to load stories");
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const buildFilterParams = () => {
    const filters = {};
    
    if (statusFilters.length > 0) {
      filters.status = statusFilters;
    }
    
    if (priorityFilters.length > 0) {
      filters.priority = priorityFilters;
    }
    
    if (assigneeFilters.length > 0) {
      filters.assignee = assigneeFilters;
    }
    
    if (storyPointsMin !== "" && storyPointsMin !== null) {
      const min = parseInt(storyPointsMin, 10);
      if (!isNaN(min) && min >= 0) {
        filters.storyPointsMin = min;
      }
    }
    
    if (storyPointsMax !== "" && storyPointsMax !== null) {
      const max = parseInt(storyPointsMax, 10);
      if (!isNaN(max) && max >= 0) {
        filters.storyPointsMax = max;
      }
    }
    
    return filters;
  };

  const validateFilters = () => {
    const errors = {};
    
    // Validate story points range
    if (storyPointsMin !== "" && storyPointsMin !== null) {
      const min = parseInt(storyPointsMin, 10);
      if (isNaN(min) || min < 0) {
        errors.storyPointsMin = "Minimum must be a non-negative number";
      }
    }
    
    if (storyPointsMax !== "" && storyPointsMax !== null) {
      const max = parseInt(storyPointsMax, 10);
      if (isNaN(max) || max < 0) {
        errors.storyPointsMax = "Maximum must be a non-negative number";
      }
    }
    
    // Validate range logic
    if (
      storyPointsMin !== "" &&
      storyPointsMax !== "" &&
      !errors.storyPointsMin &&
      !errors.storyPointsMax
    ) {
      const min = parseInt(storyPointsMin, 10);
      const max = parseInt(storyPointsMax, 10);
      if (min > max) {
        errors.storyPointsRange = "Minimum cannot be greater than maximum";
      }
    }
    
    setFilterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Client-side filtering removed - backend handles all filtering
  // The stories state contains the filtered results from the backend

  const handleStatusToggle = (status) => {
    setStatusFilters((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handlePriorityToggle = (priority) => {
    setPriorityFilters((prev) => {
      if (prev.includes(priority)) {
        return prev.filter((p) => p !== priority);
      } else {
        return [...prev, priority];
      }
    });
  };

  const handleAssigneeToggle = (assignee) => {
    setAssigneeFilters((prev) => {
      if (prev.includes(assignee)) {
        return prev.filter((a) => a !== assignee);
      } else {
        return [...prev, assignee];
      }
    });
  };

  const handleStoryPointsMinChange = (value) => {
    setStoryPointsMin(value);
  };

  const handleStoryPointsMaxChange = (value) => {
    setStoryPointsMax(value);
  };

  const clearAllFilters = () => {
    setStatusFilters([]);
    setPriorityFilters([]);
    setAssigneeFilters([]);
    setStoryPointsMin("");
    setStoryPointsMax("");
    setFilterErrors({});
  };

  const hasActiveFilters = () => {
    return (
      statusFilters.length > 0 ||
      priorityFilters.length > 0 ||
      assigneeFilters.length > 0 ||
      (storyPointsMin !== "" && storyPointsMin !== null) ||
      (storyPointsMax !== "" && storyPointsMax !== null)
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilters.length > 0) count += statusFilters.length;
    if (priorityFilters.length > 0) count += priorityFilters.length;
    if (assigneeFilters.length > 0) count += assigneeFilters.length;
    if (storyPointsMin !== "" && storyPointsMin !== null) count += 1;
    if (storyPointsMax !== "" && storyPointsMax !== null) count += 1;
    return count;
  };

  const handleSelectStory = (storyId) => {
    const newSelected = new Set(selectedStories);
    if (newSelected.has(storyId)) {
      newSelected.delete(storyId);
    } else {
      newSelected.add(storyId);
    }
    setSelectedStories(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStories.size === stories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(
        new Set(stories.filter((s) => s.id).map((s) => s.id))
      );
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const storyIds =
        selectedStories.size > 0 ? Array.from(selectedStories) : undefined;
      const result = await exportService.exportStories(
        storyIds,
        exportFormat,
        exportTarget
      );

      if (result.success) {
        setSuccessMessage(result.message);
        setShowExportModal(false);
        setSelectedStories(new Set());
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Export error:", err);
      setError(err.message || "Failed to export stories");
    } finally {
      setExporting(false);
    }
  };

  const openStoryDetails = (story) => {
    if (!story?.id) {
      return;
    }
    navigate(`/story/${story.id}`);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "#e53e3e";
      case "High":
        return "#f56565";
      case "Medium":
        return "#ed8936";
      case "Low":
        return "#48bb78";
      default:
        return "#718096";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "#48bb78";
      case "In Progress":
        return "#4299e1";
      case "In Review":
        return "#ed8936";
      case "To Do":
        return "#cbd5e0";
      default:
        return "#718096";
    }
  };

  if (loading && stories.length === 0) {
    return (
      <div className="stories-list-container">
        <div className="loading-spinner">Loading stories...</div>
      </div>
    );
  }

  if (error && stories.length === 0) {
    return (
      <div className="stories-list-container">
        <ErrorPlaceholder
          title="Failed to Load Stories"
          message={error}
          icon="⚠️"
          actionLabel="Retry"
          onAction={loadStories}
        />
      </div>
    );
  }

  return (
    <div className="stories-list-container">
      <div className="stories-list-wrapper">
        <div className="stories-header">
          <h2 className="stories-title">User Stories Backlog</h2>
          <div className="header-actions">
            <button
              className="export-btn"
              onClick={() => setShowExportModal(true)}
              disabled={stories.length === 0}
              title="Export stories"
            >
              📥 Export
            </button>
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
              >
                Table
              </button>
              <button
                className={`view-btn ${viewMode === "card" ? "active" : ""}`}
                onClick={() => setViewMode("card")}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="filters-section">
          <div className="filters-header">
            <h3 className="filters-title">Filters</h3>
            {hasActiveFilters() && (
              <button
                className="btn btn-secondary btn-clear-filters"
                onClick={clearAllFilters}
                title="Clear all filters"
              >
                Clear All ({getActiveFiltersCount()})
              </button>
            )}
          </div>

          <div className="filters-grid">
            {/* Status Multi-Select Filter */}
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="multi-select-container">
                {availableStatuses.map((status) => (
                  <label key={status} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={statusFilters.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                    />
                    <span
                      className="filter-chip"
                      style={{
                        backgroundColor: statusFilters.includes(status)
                          ? getStatusColor(status)
                          : "#e2e8f0",
                        color: statusFilters.includes(status) ? "white" : "#4a5568",
                      }}
                    >
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Multi-Select Filter */}
            <div className="filter-group">
              <label className="filter-label">Priority</label>
              <div className="multi-select-container">
                {availablePriorities.map((priority) => (
                  <label key={priority} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={priorityFilters.includes(priority)}
                      onChange={() => handlePriorityToggle(priority)}
                    />
                    <span
                      className="filter-chip"
                      style={{
                        backgroundColor: priorityFilters.includes(priority)
                          ? getPriorityColor(priority)
                          : "#e2e8f0",
                        color: priorityFilters.includes(priority) ? "white" : "#4a5568",
                      }}
                    >
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assignee Multi-Select Filter */}
            {availableAssignees.length > 0 && (
              <div className="filter-group">
                <label className="filter-label">Assignee</label>
                <div className="multi-select-container multi-select-scrollable">
                  {availableAssignees.map((assignee) => (
                    <label key={assignee} className="multi-select-option">
                      <input
                        type="checkbox"
                        checked={assigneeFilters.includes(assignee)}
                        onChange={() => handleAssigneeToggle(assignee)}
                      />
                      <span
                        className={`filter-chip ${
                          assigneeFilters.includes(assignee) ? "active" : ""
                        }`}
                      >
                        {assignee}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Story Points Range Filter */}
            <div className="filter-group">
              <label className="filter-label">Story Points Range</label>
              <div className="range-inputs">
                <div className="range-input-group">
                  <label htmlFor="story-points-min">Min:</label>
                  <input
                    id="story-points-min"
                    type="number"
                    min="0"
                    value={storyPointsMin}
                    onChange={(e) => handleStoryPointsMinChange(e.target.value)}
                    className={`range-input ${filterErrors.storyPointsMin ? "error" : ""}`}
                    placeholder="0"
                  />
                  {filterErrors.storyPointsMin && (
                    <span className="error-text">{filterErrors.storyPointsMin}</span>
                  )}
                </div>
                <div className="range-input-group">
                  <label htmlFor="story-points-max">Max:</label>
                  <input
                    id="story-points-max"
                    type="number"
                    min="0"
                    value={storyPointsMax}
                    onChange={(e) => handleStoryPointsMaxChange(e.target.value)}
                    className={`range-input ${filterErrors.storyPointsMax ? "error" : ""}`}
                    placeholder="∞"
                  />
                  {filterErrors.storyPointsMax && (
                    <span className="error-text">{filterErrors.storyPointsMax}</span>
                  )}
                </div>
              </div>
              {filterErrors.storyPointsRange && (
                <span className="error-text">{filterErrors.storyPointsRange}</span>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="active-filters">
              <span className="active-filters-label">Active Filters:</span>
              <div className="active-filters-list">
                {statusFilters.map((status) => (
                  <span key={`status-${status}`} className="active-filter-badge">
                    Status: {status}
                    <button
                      className="remove-filter-btn"
                      onClick={() => handleStatusToggle(status)}
                      aria-label={`Remove ${status} filter`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {priorityFilters.map((priority) => (
                  <span key={`priority-${priority}`} className="active-filter-badge">
                    Priority: {priority}
                    <button
                      className="remove-filter-btn"
                      onClick={() => handlePriorityToggle(priority)}
                      aria-label={`Remove ${priority} filter`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {assigneeFilters.map((assignee) => (
                  <span key={`assignee-${assignee}`} className="active-filter-badge">
                    Assignee: {assignee}
                    <button
                      className="remove-filter-btn"
                      onClick={() => handleAssigneeToggle(assignee)}
                      aria-label={`Remove ${assignee} filter`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {storyPointsMin !== "" && storyPointsMin !== null && (
                  <span className="active-filter-badge">
                    Min Points: {storyPointsMin}
                    <button
                      className="remove-filter-btn"
                      onClick={() => setStoryPointsMin("")}
                      aria-label="Remove minimum story points filter"
                    >
                      ×
                    </button>
                  </span>
                )}
                {storyPointsMax !== "" && storyPointsMax !== null && (
                  <span className="active-filter-badge">
                    Max Points: {storyPointsMax}
                    <button
                      className="remove-filter-btn"
                      onClick={() => setStoryPointsMax("")}
                      aria-label="Remove maximum story points filter"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="filter-group">
            <label htmlFor="priority-search" className="filter-label">
              Search Priority:
            </label>
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
            <label htmlFor="story-points-range" className="filter-label">
              Story Points Range:
            </label>
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

          <div className="stories-count">
            Showing <strong>{stories.length}</strong> story{stories.length !== 1 ? "ies" : ""}
            {selectedStories.size > 0 && (
              <span className="selected-count">
                {" "}
                ({selectedStories.size} selected)
              </span>
            )}
            {hasActiveFilters() && (
              <span className="filter-indicator">
                {" "}
                (filtered by backend)
              </span>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        {error && <div className="error-message">{error}</div>}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="table-container">
            <table className="stories-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        stories.length > 0 &&
                        selectedStories.size ===
                          stories.filter((s) => s.id).length
                      }
                      onChange={handleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Story Points</th>
                  <th>Status</th>
                  {availableAssignees.length > 0 && <th>Assignee</th>}
                </tr>
              </thead>
              <tbody>
                {stories.length === 0 ? (
                  <tr>
                    <td colSpan={availableAssignees.length > 0 ? 6 : 5} className="empty-message">
                      No stories found.{" "}
                      {hasActiveFilters()
                        ? "Try adjusting your filters."
                        : "Create your first story to get started!"}
                    </td>
                  </tr>
                ) : (
                  stories.map((story, index) => (
                    <tr
                      key={story.id || index}
                      className={story.id ? "story-row-clickable" : ""}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={story.id ? selectedStories.has(story.id) : false}
                          onChange={() =>
                            story.id && handleSelectStory(story.id)
                          }
                          disabled={!story.id}
                        />
                      </td>
                      <td
                        className="title-cell"
                        onClick={() => openStoryDetails(story)}
                        role={story.id ? "button" : undefined}
                        tabIndex={story.id ? 0 : undefined}
                        onKeyDown={(event) => {
                          if (
                            story.id &&
                            (event.key === "Enter" || event.key === " ")
                          ) {
                            event.preventDefault();
                            openStoryDetails(story);
                          }
                        }}
                      >
                        {story.title}
                      </td>
                      <td>
                        <span
                          className="priority-badge"
                          style={{
                            backgroundColor: getPriorityColor(story.priority),
                          }}
                        >
                          {story.priority}
                        </span>
                      </td>
                      <td>{story.storyPoints || "-"}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(story.status),
                          }}
                        >
                          {story.status}
                        </span>
                      </td>
                      {availableAssignees.length > 0 && (
                        <td>{story.assignee || "-"}</td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Card View */}
        {viewMode === "card" && (
          <div className="cards-container">
            {stories.length === 0 ? (
              <div className="empty-message-card">
                <p>
                  No stories found.{" "}
                  {hasActiveFilters()
                    ? "Try adjusting your filters."
                    : "Create your first story to get started!"}
                </p>
              </div>
            ) : (
              stories.map((story, index) => (
                <div
                  key={story.id || index}
                  className={`story-card ${
                    story.id ? "story-card-clickable" : ""
                  }`}
                  onClick={() => openStoryDetails(story)}
                  role={story.id ? "button" : undefined}
                  tabIndex={story.id ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (
                      story.id &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      openStoryDetails(story);
                    }
                  }}
                >
                  <div className="card-header">
                    <h3 className="card-title">{story.title}</h3>
                  </div>
                  <div className="card-body">
                    <div className="card-field">
                      <span className="field-label">Priority:</span>
                      <span
                        className="priority-badge"
                        style={{
                          backgroundColor: getPriorityColor(story.priority),
                        }}
                      >
                        {story.priority}
                      </span>
                    </div>
                    <div className="card-field">
                      <span className="field-label">Story Points:</span>
                      <span className="field-value">
                        {story.storyPoints || "-"}
                      </span>
                    </div>
                    <div className="card-field">
                      <span className="field-label">Status:</span>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(story.status),
                        }}
                      >
                        {story.status}
                      </span>
                    </div>
                    {story.assignee && (
                      <div className="card-field">
                        <span className="field-label">Assignee:</span>
                        <span className="field-value">{story.assignee}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="refresh-section">
          <button className="btn btn-primary" onClick={() => loadStories()}>
            Refresh
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Stories</h3>
              <button
                className="modal-close"
                onClick={() => setShowExportModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="export-info">
                {selectedStories.size > 0
                  ? `Export ${selectedStories.size} selected story/stories`
                  : "Export all stories"}
              </p>

              <div className="form-group">
                <label htmlFor="export-format">Format:</label>
                <select
                  id="export-format"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="form-select"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="export-target">Target System:</label>
                <select
                  id="export-target"
                  value={exportTarget}
                  onChange={(e) => setExportTarget(e.target.value)}
                  className="form-select"
                >
                  <option value="generic">Generic</option>
                  <option value="jira">Jira</option>
                  <option value="taiga">Taiga</option>
                </select>
              </div>

              {error && <div className="error-message">{error}</div>}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesListView;
