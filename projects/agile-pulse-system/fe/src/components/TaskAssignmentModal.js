/**
 * Task Assignment Modal Component
 * Allows assigning tasks/stories to sprints with bulk selection
 */

import React, { useState, useEffect } from "react";
import sprintsService from "../services/sprintsService";
import "./TaskAssignmentModal.css";

const TaskAssignmentModal = ({ isOpen, onClose, onAssignmentSuccess }) => {
  const [sprints, setSprints] = useState([]);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assigning, setAssigning] = useState(false);

  // Load sprints and backlog tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Reset state when modal closes
      resetState();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoadingData(true);
    setError(null);
    setSuccess(null);

    try {
      // Load sprints and filter for active/upcoming only
      const allSprints = await sprintsService.getAllSprints();
      const activeSprints = allSprints.filter((sprint) =>
        sprintsService.isSprintActiveOrUpcoming(sprint)
      );
      setSprints(activeSprints);

      // Load unassigned stories (backlog tasks)
      const unassignedStories = await sprintsService.getUnassignedStories();
      setBacklogTasks(unassignedStories);

      // If no active sprints, show error
      if (activeSprints.length === 0) {
        setError(
          "No active or upcoming sprints available. Please create a sprint first."
        );
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError(
        err.message || "Failed to load sprints and tasks. Please try again."
      );
    } finally {
      setLoadingData(false);
    }
  };

  const resetState = () => {
    setSelectedSprint("");
    setSelectedTasks(new Set());
    setError(null);
    setSuccess(null);
    setBacklogTasks([]);
    setSprints([]);
  };

  const handleTaskToggle = (taskId) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === backlogTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(backlogTasks.map((task) => task.id)));
    }
  };

  const handleSprintChange = (e) => {
    setSelectedSprint(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const validateAssignment = () => {
    if (!selectedSprint) {
      setError("Please select a target sprint.");
      return false;
    }

    if (selectedTasks.size === 0) {
      setError("Please select at least one task to assign.");
      return false;
    }

    // Check if selected sprint is still active/upcoming
    const sprint = sprints.find((s) => s.name === selectedSprint);
    if (!sprint) {
      setError("Selected sprint is no longer available.");
      return false;
    }

    if (!sprintsService.isSprintActiveOrUpcoming(sprint)) {
      setError("Only active or upcoming sprints can receive new tasks.");
      return false;
    }

    return true;
  };

  const handleAssign = async () => {
    if (!validateAssignment()) {
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      const taskIds = Array.from(selectedTasks);
      const result = await sprintsService.assignStoriesToSprint(
        taskIds,
        selectedSprint
      );

      if (result.failed.length > 0) {
        // Some assignments failed
        const errorMessages = result.failed
          .map((f) => `Task ${f.storyId}: ${f.error}`)
          .join(", ");
        setError(
          `Some assignments failed: ${errorMessages}. ${
            result.successful.length
          } task(s) assigned successfully.`
        );
      } else {
        // All assignments succeeded
        setSuccess(
          `Successfully assigned ${result.successful.length} task(s) to ${selectedSprint}.`
        );
      }

      // Refresh backlog tasks
      const unassignedStories = await sprintsService.getUnassignedStories();
      setBacklogTasks(unassignedStories);

      // Clear selections after successful assignment
      if (result.failed.length === 0) {
        setSelectedTasks(new Set());
        setSelectedSprint("");
      }

      // Notify parent component if callback provided
      if (onAssignmentSuccess && result.successful.length > 0) {
        onAssignmentSuccess(result.successful);
      }
    } catch (err) {
      console.error("Error assigning tasks:", err);
      setError(
        err.message ||
          "Failed to assign tasks. Please check your connection and try again."
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="task-assignment-modal-overlay" onClick={handleClose}>
      <div
        className="task-assignment-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="task-assignment-modal-header">
          <h2 className="task-assignment-modal-title">Assign Tasks to Sprint</h2>
          <button
            className="task-assignment-modal-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
          >
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

        <div className="task-assignment-modal-body">
          {loadingData ? (
            <div className="task-assignment-loading">
              <p>Loading sprints and tasks...</p>
            </div>
          ) : (
            <>
              {/* Sprint Selection */}
              <div className="task-assignment-section">
                <label htmlFor="sprint-select" className="task-assignment-label">
                  Select Target Sprint <span className="required">*</span>
                </label>
                <select
                  id="sprint-select"
                  className="task-assignment-select"
                  value={selectedSprint}
                  onChange={handleSprintChange}
                  disabled={assigning || sprints.length === 0}
                >
                  <option value="">-- Select a sprint --</option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.name}>
                      {sprint.name}
                      {sprint.start_date || sprint.end_date
                        ? ` (${
                            sprint.start_date
                              ? new Date(sprint.start_date).toLocaleDateString()
                              : ""
                          }${
                            sprint.start_date && sprint.end_date ? " - " : ""
                          }${
                            sprint.end_date
                              ? new Date(sprint.end_date).toLocaleDateString()
                              : ""
                          })`
                        : ""}
                    </option>
                  ))}
                </select>
                {sprints.length === 0 && (
                  <p className="task-assignment-hint">
                    No active or upcoming sprints available.
                  </p>
                )}
              </div>

              {/* Backlog Tasks List */}
              <div className="task-assignment-section">
                <div className="task-assignment-section-header">
                  <label className="task-assignment-label">
                    Select Tasks from Backlog
                  </label>
                  {backlogTasks.length > 0 && (
                    <button
                      type="button"
                      className="task-assignment-select-all-btn"
                      onClick={handleSelectAll}
                      disabled={assigning}
                    >
                      {selectedTasks.size === backlogTasks.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>

                {backlogTasks.length === 0 ? (
                  <div className="task-assignment-empty">
                    <p>No unassigned tasks in the backlog.</p>
                  </div>
                ) : (
                  <div className="task-assignment-tasks-list">
                    {backlogTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`task-assignment-task-item ${
                          selectedTasks.has(task.id) ? "selected" : ""
                        }`}
                      >
                        <label className="task-assignment-task-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task.id)}
                            onChange={() => handleTaskToggle(task.id)}
                            disabled={assigning}
                            className="task-assignment-task-checkbox"
                          />
                          <div className="task-assignment-task-info">
                            <div className="task-assignment-task-header">
                              <span className="task-assignment-task-title">
                                {task.title}
                              </span>
                              <div className="task-assignment-task-badges">
                                <span
                                  className="task-assignment-badge priority-badge"
                                  style={{
                                    backgroundColor: getPriorityColor(
                                      task.priority
                                    ),
                                  }}
                                >
                                  {task.priority}
                                </span>
                                <span
                                  className="task-assignment-badge status-badge"
                                  style={{
                                    backgroundColor: getStatusColor(task.status),
                                  }}
                                >
                                  {task.status}
                                </span>
                                {task.storyPoints && (
                                  <span className="task-assignment-badge points-badge">
                                    {task.storyPoints} pts
                                  </span>
                                )}
                              </div>
                            </div>
                            {task.description && (
                              <p className="task-assignment-task-description">
                                {task.description.length > 100
                                  ? `${task.description.substring(0, 100)}...`
                                  : task.description}
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {backlogTasks.length > 0 && (
                  <p className="task-assignment-hint">
                    {selectedTasks.size} of {backlogTasks.length} task(s)
                    selected
                  </p>
                )}
              </div>

              {/* Messages */}
              {error && (
                <div className="task-assignment-message error-message" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="task-assignment-message success-message" role="status">
                  {success}
                </div>
              )}
            </>
          )}
        </div>

        <div className="task-assignment-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAssign}
            disabled={
              assigning ||
              loadingData ||
              selectedTasks.size === 0 ||
              !selectedSprint ||
              sprints.length === 0
            }
          >
            {assigning ? "Assigning..." : "Assign to Sprint"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskAssignmentModal;

