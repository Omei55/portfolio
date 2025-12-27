import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import sprintService from "../services/sprintService";
import userStoriesService from "../services/userStoriesService";
import SprintReadinessPanel from "./SprintReadinessPanel";
import "./SprintManagement.css";

const SprintManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [sprints, setSprints] = useState([]);
  const [unassignedStories, setUnassignedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [sprintStats, setSprintStats] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sprintsData, unassignedData] = await Promise.all([
        sprintService.getAllSprints(),
        sprintService.getUnassignedStories(),
      ]);
      console.log("Loaded sprints:", sprintsData);
      console.log(
        "Sprints count:",
        Array.isArray(sprintsData) ? sprintsData.length : 0
      );
      setSprints(Array.isArray(sprintsData) ? sprintsData : []);
      setUnassignedStories(Array.isArray(unassignedData) ? unassignedData : []);
    } catch (err) {
      console.error("Failed to load sprint data:", err);
      setError(err.message || "Failed to load sprint data");
      setSprints([]);
      setUnassignedStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedSprint) {
      loadSprintStats(selectedSprint.name);
    }
  }, [selectedSprint]);

  const loadSprintStats = async (sprintName) => {
    try {
      const stats = await sprintService.getSprintStats(sprintName);
      if (stats) {
        setSprintStats((prev) => ({
          ...prev,
          [sprintName]: stats,
        }));
      }
    } catch (err) {
      console.error("Failed to load sprint stats:", err);
    }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!newSprintName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await sprintService.createSprint({
        name: newSprintName.trim(),
      });
      const message = result?.message || "Sprint created successfully";
      showSuccess(message);
      setShowCreateForm(false);
      setNewSprintName("");
      setError(null);
      await loadData();
    } catch (err) {
      console.error("Failed to create sprint:", err);
      const errorMsg = err.message || "Failed to create sprint";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectSprint = async (sprint) => {
    setSelectedSprint(sprint);
    // Load stories for the selected sprint
    if (sprint && sprint.name) {
      try {
        const stories = await sprintService.getSprintStories(sprint.name);
        setSelectedSprint({
          ...sprint,
          stories: stories,
        });
      } catch (err) {
        console.error("Failed to load sprint stories:", err);
      }
    }
  };

  const handleAssignStory = async (storyId, sprintName) => {
    try {
      const result = await sprintService.assignStoryToSprint(storyId, sprintName);
      const message = result?.message || "Story assigned to sprint successfully";
      showSuccess(message);
      await loadData();
      if (selectedSprint && selectedSprint.name === sprintName) {
        const stories = await sprintService.getSprintStories(sprintName);
        const updatedSprint = sprints.find((s) => s.name === sprintName);
        if (updatedSprint) {
          setSelectedSprint({
            ...updatedSprint,
            stories: stories,
          });
        }
      }
    } catch (err) {
      console.error("Failed to assign story:", err);
      const errorMsg = err.message || "Failed to assign story to sprint";
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleUnassignStory = async (storyId) => {
    try {
      const result = await sprintService.unassignStoryFromSprint(storyId);
      const message = result?.message || "Story unassigned from sprint successfully";
      showSuccess(message);
      await loadData();
      if (selectedSprint && selectedSprint.name) {
        const stories = await sprintService.getSprintStories(
          selectedSprint.name
        );
        const updatedSprint = sprints.find(
          (s) => s.name === selectedSprint.name
        );
        if (updatedSprint) {
          setSelectedSprint({
            ...updatedSprint,
            stories: stories,
          });
        } else {
          setSelectedSprint(null);
        }
      }
    } catch (err) {
      console.error("Failed to unassign story:", err);
      const errorMsg = err.message || "Failed to unassign story";
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleMoveStory = async (storyId, fromSprint, toSprint) => {
    try {
      await sprintService.moveStoryToSprint(storyId, fromSprint, toSprint);
      await loadData();
      if (selectedSprint && selectedSprint.name) {
        const stories = await sprintService.getSprintStories(
          selectedSprint.name
        );
        const updatedSprint = sprints.find(
          (s) => s.name === selectedSprint.name
        );
        if (updatedSprint) {
          setSelectedSprint({
            ...updatedSprint,
            stories: stories,
          });
        }
      }
    } catch (err) {
      console.error("Failed to move story:", err);
      setError(err.message || "Failed to move story");
    }
  };

  const handleDeleteClick = (sprintName) => {
    setSprintToDelete(sprintName);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sprintToDelete) return;

    try {
      const sprint = sprints.find((s) => s.name === sprintToDelete);
      if (sprint && sprint.id) {
        const result = await sprintService.deleteSprint(sprint.id);
        const message = result?.message || "Sprint deleted successfully";
        showSuccess(message);
        setShowDeleteConfirm(false);
        setSprintToDelete(null);
        await loadData();
        if (selectedSprint && selectedSprint.name === sprintToDelete) {
          setSelectedSprint(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete sprint:", err);
      const errorMsg = err.message || "Failed to delete sprint";
      setError(errorMsg);
      showError(errorMsg);
      setShowDeleteConfirm(false);
      setSprintToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSprintToDelete(null);
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
      case "To Do":
        return "#cbd5e0";
      default:
        return "#718096";
    }
  };

  if (loading) {
    return (
      <div className="sprint-management">
        <div className="sprint-loading">
          <div>Loading sprints...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sprint-management">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="nav-content">
          <div className="nav-logo">
            <h1 className="logo-text">Agile Pulse</h1>
          </div>
          <div className="nav-actions">
            <button
              className="nav-button"
              onClick={() => navigate("/dashboard")}
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="sprint-content">
        <div className="sprint-header">
          <h2 className="sprint-title">Sprint Management</h2>
          <button
            className="create-sprint-button"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            + New Sprint
          </button>
        </div>

        {error && (
          <div className="sprint-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {showCreateForm && (
          <div className="create-sprint-form">
            <form onSubmit={handleCreateSprint}>
              <div className="form-group">
                <label htmlFor="sprintName">Sprint Name</label>
                <input
                  type="text"
                  id="sprintName"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="e.g., Sprint 1, Q1 2025, Feature Release"
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewSprintName("");
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Sprint"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="sprint-layout">
          {/* Sprint List Sidebar */}
          <div className="sprint-sidebar">
            <h3 className="sidebar-title">Sprints ({sprints.length})</h3>
            {sprints.length === 0 ? (
              <div className="empty-state">
                <p>No sprints yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="sprint-list">
                {sprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    className={`sprint-item ${
                      selectedSprint?.id === sprint.id ? "active" : ""
                    }`}
                    onClick={() => handleSelectSprint(sprint)}
                  >
                    <div className="sprint-item-header">
                      <h4 className="sprint-item-name">{sprint.name}</h4>
                      <button
                        className="sprint-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(sprint.name);
                        }}
                        title="Delete Sprint"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="sprint-item-meta">
                      <span className="sprint-meta-item">
                        📋 {sprint.story_count} stories
                      </span>
                      <span className="sprint-meta-item">
                        ⭐ {sprint.total_points} points
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unassigned Stories Section */}
            {unassignedStories.length > 0 && (
              <div className="unassigned-section">
                <h3 className="sidebar-title">
                  Unassigned ({unassignedStories.length})
                </h3>
                <div className="unassigned-list">
                  {unassignedStories.slice(0, 5).map((story) => (
                    <div 
                      key={story.id} 
                      className="unassigned-story-item"
                      onClick={() => navigate(`/story/${story.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="story-title-truncated">
                        {story.title}
                      </span>
                      <select
                        className="assign-select"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignStory(story.id, e.target.value);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <option value="">Assign to...</option>
                        {sprints.map((sprint) => (
                          <option key={sprint.id} value={sprint.name}>
                            {sprint.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {unassignedStories.length > 5 && (
                    <div className="more-unassigned">
                      +{unassignedStories.length - 5} more unassigned stories
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sprint Detail View */}
          <div className="sprint-detail">
            {selectedSprint ? (
              <>
                <div className="sprint-detail-header">
                  <div>
                    <h2 className="sprint-detail-title">
                      {selectedSprint.name}
                    </h2>
                    <div className="sprint-detail-meta">
                      <span>
                        📋 {selectedSprint.story_count} stories • ⭐{" "}
                        {selectedSprint.total_points} story points
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sprint Readiness Panel */}
                <SprintReadinessPanel
                  sprint={selectedSprint}
                  stories={selectedSprint.stories || []}
                />

                {sprintStats[selectedSprint.name] && (
                  <div className="sprint-stats">
                    <div className="stat-card">
                      <div className="stat-label">Total Stories</div>
                      <div className="stat-value">
                        {sprintStats[selectedSprint.name].total_stories}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Total Points</div>
                      <div className="stat-value">
                        {sprintStats[selectedSprint.name].total_points}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">By Status</div>
                      <div className="stat-breakdown">
                        {Object.entries(
                          sprintStats[selectedSprint.name].by_status
                        ).map(([status, count]) => (
                          <span key={status} className="stat-item">
                            {status}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="sprint-stories-section">
                  <h3 className="section-title">Stories in Sprint</h3>
                  {selectedSprint.stories &&
                  selectedSprint.stories.length > 0 ? (
                    <div className="sprint-stories-list">
                      {selectedSprint.stories.map((story) => (
                        <div 
                          key={story.id} 
                          className="sprint-story-card"
                          onClick={() => navigate(`/story/${story.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="story-card-header">
                            <h4 className="story-card-title">
                              {story.title}
                            </h4>
                            <button
                              className="story-unassign-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnassignStory(story.id);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title="Remove from Sprint"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="story-card-body">
                            <p className="story-description">
                              {story.description?.substring(0, 150)}
                              {story.description?.length > 150 ? "..." : ""}
                            </p>
                          </div>
                          <div className="story-card-footer">
                            <div className="story-tags">
                              <span
                                className="story-tag priority-tag"
                                style={{
                                  backgroundColor: getPriorityColor(
                                    story.priority
                                  ),
                                  color: "white",
                                }}
                              >
                                {story.priority || "Medium"}
                              </span>
                              <span
                                className="story-tag status-tag"
                                style={{
                                  backgroundColor: getStatusColor(story.status),
                                  color: "white",
                                }}
                              >
                                {story.status || "To Do"}
                              </span>
                              {story.story_points && (
                                <span className="story-tag points-tag">
                                  ⭐ {story.story_points}
                                </span>
                              )}
                              {story.assignee && (
                                <span className="story-tag assignee-tag">
                                  👤 {story.assignee}
                                </span>
                              )}
                            </div>
                            <div className="story-actions">
                              <select
                                className="move-select"
                                value={selectedSprint.name}
                                onChange={(e) => {
                                  if (e.target.value !== selectedSprint.name) {
                                    handleMoveStory(
                                      story.id,
                                      selectedSprint.name,
                                      e.target.value
                                    );
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <option value={selectedSprint.name}>
                                  Move to...
                                </option>
                                {sprints
                                  .filter((s) => s.id !== selectedSprint.id)
                                  .map((sprint) => (
                                    <option key={sprint.id} value={sprint.name}>
                                      {sprint.name}
                                    </option>
                                  ))}
                                <option value="">Unassign</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No stories assigned to this sprint yet.</p>
                      <p className="empty-hint">
                        Assign stories from the unassigned section or from the
                        story list.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="sprint-detail-empty">
                <div className="empty-state-large">
                  <h3>Select a Sprint</h3>
                  <p>
                    Choose a sprint from the sidebar to view its details and
                    manage stories.
                  </p>
                  {sprints.length === 0 && (
                    <button
                      className="create-first-sprint-btn"
                      onClick={() => setShowCreateForm(true)}
                    >
                      Create Your First Sprint
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintManagement;
