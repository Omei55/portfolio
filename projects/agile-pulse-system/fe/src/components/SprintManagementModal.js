import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import sprintService from "../services/sprintService";
import userStoriesService from "../services/userStoriesService";
import "./SprintManagementModal.css";

const SprintManagementModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [unassignedStories, setUnassignedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintStartDate, setNewSprintStartDate] = useState("");
  const [newSprintEndDate, setNewSprintEndDate] = useState("");
  const [newSprintDescription, setNewSprintDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [sprintStats, setSprintStats] = useState({});
  const [sprintStories, setSprintStories] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sprintsData, unassignedData] = await Promise.all([
        sprintService.getAllSprints(),
        sprintService.getUnassignedStories(),
      ]);
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
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  useEffect(() => {
    if (selectedSprint && selectedSprint.name) {
      loadSprintStats(selectedSprint.name);
      loadSprintStories(selectedSprint.name);
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

  const loadSprintStories = async (sprintName) => {
    try {
      const stories = await sprintService.getSprintStories(sprintName);
      setSprintStories(Array.isArray(stories) ? stories : []);
    } catch (err) {
      console.error("Failed to load sprint stories:", err);
      setSprintStories([]);
    }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!newSprintName.trim() || !newSprintStartDate || !newSprintEndDate) {
      setError("Name, start date, and end date are required");
      return;
    }

    // Validate date range
    const startDate = new Date(newSprintStartDate);
    const endDate = new Date(newSprintEndDate);
    if (endDate < startDate) {
      setError("End date must be greater than or equal to start date");
      return;
    }

    setIsCreating(true);
    try {
      // Format dates as ISO strings
      await sprintService.createSprint({
        name: newSprintName.trim(),
        startDate: new Date(newSprintStartDate).toISOString(),
        endDate: new Date(newSprintEndDate).toISOString(),
        description: newSprintDescription.trim() || undefined,
      });
      setShowCreateForm(false);
      setNewSprintName("");
      setNewSprintStartDate("");
      setNewSprintEndDate("");
      setNewSprintDescription("");
      setError(null);
      await loadData();
    } catch (err) {
      console.error("Failed to create sprint:", err);
      setError(err.message || "Failed to create sprint");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectSprint = async (sprint) => {
    setSelectedSprint(sprint);
  };

  const handleAssignStory = async (storyId, sprintName) => {
    try {
      await sprintService.assignStoryToSprint(storyId, sprintName);
      await loadData();
      if (selectedSprint && selectedSprint.name === sprintName) {
        await loadSprintStories(sprintName);
      }
    } catch (err) {
      console.error("Failed to assign story:", err);
      setError(err.message || "Failed to assign story");
    }
  };

  const handleUnassignStory = async (storyId) => {
    try {
      await sprintService.unassignStoryFromSprint(storyId);
      await loadData();
      if (selectedSprint) {
        await loadSprintStories(selectedSprint.name);
      }
    } catch (err) {
      console.error("Failed to unassign story:", err);
      setError(err.message || "Failed to unassign story");
    }
  };

  const handleDeleteSprint = async (sprintName) => {
    if (
      !window.confirm(`Are you sure you want to delete sprint "${sprintName}"?`)
    ) {
      return;
    }

    try {
      // Find sprint by name and delete
      const sprint = sprints.find((s) => s.name === sprintName);
      if (sprint && sprint.id) {
        await sprintService.deleteSprint(sprint.id);
        if (selectedSprint && selectedSprint.name === sprintName) {
          setSelectedSprint(null);
          setSprintStories([]);
        }
        await loadData();
      }
    } catch (err) {
      console.error("Failed to delete sprint:", err);
      setError(err.message || "Failed to delete sprint");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sprint-modal-overlay" onClick={onClose}>
      <div
        className="sprint-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sprint-modal-header">
          <h2 className="sprint-modal-title">Manage Sprints</h2>
          <button className="sprint-modal-close-btn" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="sprint-modal-body">
          {error && (
            <div className="sprint-error">
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {showCreateForm && (
            <form onSubmit={handleCreateSprint} className="create-sprint-form">
              <h3>Create New Sprint</h3>
              <div className="form-group">
                <label>Sprint Name *</label>
                <input
                  type="text"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="e.g., Sprint 1"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={newSprintStartDate}
                    onChange={(e) => setNewSprintStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={newSprintEndDate}
                    onChange={(e) => setNewSprintEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newSprintDescription}
                  onChange={(e) => setNewSprintDescription(e.target.value)}
                  placeholder="Optional description"
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewSprintName("");
                    setNewSprintStartDate("");
                    setNewSprintEndDate("");
                    setNewSprintDescription("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Sprint"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="sprint-loading">Loading sprints...</div>
          ) : (
            <div className="sprint-modal-layout">
              <div className="sprint-sidebar">
                <div className="sidebar-header">
                  <h3>Sprints ({sprints.length})</h3>
                  <button
                    className="create-sprint-btn-small"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                  >
                    + New
                  </button>
                </div>
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
                          <h4>{sprint.name}</h4>
                          <button
                            className="sprint-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSprint(sprint.name);
                            }}
                            title="Delete Sprint"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="sprint-item-meta">
                          <span>📋 {sprint.story_count || 0} stories</span>
                          <span>⭐ {sprint.total_points || 0} points</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {unassignedStories.length > 0 && (
                  <div className="unassigned-section">
                    <h4>Unassigned Stories ({unassignedStories.length})</h4>
                    <div className="unassigned-list">
                      {unassignedStories.slice(0, 5).map((story) => (
                        <div key={story.id} className="unassigned-story">
                          <span>{story.title}</span>
                          {selectedSprint && (
                            <button
                              className="assign-btn"
                              onClick={() =>
                                handleAssignStory(story.id, selectedSprint.name)
                              }
                              title="Assign to selected sprint"
                            >
                              +
                            </button>
                          )}
                        </div>
                      ))}
                      {unassignedStories.length > 5 && (
                        <p className="more-stories">
                          +{unassignedStories.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="sprint-detail">
                {selectedSprint ? (
                  <div>
                    <h3>{selectedSprint.name}</h3>
                    {sprintStats[selectedSprint.name] && (
                      <div className="sprint-stats">
                        <div className="stat-item">
                          <span className="stat-label">Stories:</span>
                          <span className="stat-value">
                            {sprintStats[selectedSprint.name].story_count || 0}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Total Points:</span>
                          <span className="stat-value">
                            {sprintStats[selectedSprint.name].total_points || 0}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="sprint-stories-list">
                      <h4>Stories in Sprint</h4>
                      {sprintStories.length === 0 ? (
                        <p>No stories assigned to this sprint.</p>
                      ) : (
                        <div className="stories-list">
                          {sprintStories.map((story) => (
                            <div key={story.id} className="story-item">
                              <div className="story-info">
                                <h5>{story.title}</h5>
                                <p>{story.status}</p>
                              </div>
                              <button
                                className="unassign-btn"
                                onClick={() => handleUnassignStory(story.id)}
                                title="Unassign from sprint"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="sprint-detail-empty">
                    <p>Select a sprint to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SprintManagementModal;
