import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import userStoriesService from "../services/userStoriesService";
import taskService from "../services/taskService";
import TaskList from "./TaskList";
import TaskComments from "./TaskComments";
import ErrorPlaceholder from "./ErrorPlaceholder";
import "./ViewStoryDetails.css";

const getSampleStoryData = () => ({
  id: "sample-001",
  title: "Implement User Authentication System",
  description:
    "As a user, I want to be able to securely log in and register for the application so that I can access my personalized dashboard and manage my user stories. This feature will include email/password authentication, password encryption, session management, and password reset functionality.",
  acceptanceCriteria:
    "1. User can register with email and password\n2. User can log in with valid credentials\n3. Invalid login attempts are rejected\n4. Passwords are encrypted using bcrypt\n5. Sessions are managed securely with JWT tokens\n6. User can reset password via email\n7. Password must meet security requirements (min 8 chars, special characters)",
  status: "In Progress",
  priority: "High",
  storyPoints: 8,
  assignee: "John Doe",
  sprint: "Sprint 3 - Q1 2024",
  epic: "User Management",
  value: 8,
  effort: 6,
  tags: ["authentication", "security", "backend", "api", "user-management"],
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  hasTests: true,
  hasBlockers: false,
});

const readinessLabels = {
  points: "Points",
  priority: "Priority",
  estimation: "Estimation",
  tests: "Tests",
  blockers: "Blockers",
  mvpTag: "MVP Tag",
};

const computeLocalReadiness = (story) => {
  if (!story) {
    return null;
  }

  const storyPoints = story.storyPoints ?? story.story_points ?? null;
  const hasTests = story.hasTests ?? false;
  const hasBlockers = story.hasBlockers ?? false;
  const tags = story.tags ?? [];
  const priority = story.priority ?? "";

  const checklist = {
    points: {
      value: storyPoints,
      required: true,
      passed: typeof storyPoints === "number" && storyPoints > 0,
    },
    priority: {
      value: priority || "Medium",
      required: true,
      passed: typeof priority === "string" && priority.trim() !== "",
    },
    estimation: {
      value: storyPoints,
      required: true,
      passed: typeof storyPoints === "number" && storyPoints > 0,
    },
    tests: {
      value: hasTests,
      required: true,
      passed: hasTests === true,
    },
    blockers: {
      value: hasBlockers,
      required: true,
      passed: hasBlockers === false,
    },
    mvpTag: {
      value: Array.isArray(tags) ? tags.includes("MVP") : false,
      required: false,
      passed: true,
    },
  };

  const failedChecks = [];

  if (!checklist.points.passed) {
    failedChecks.push("Points must be entered");
  }
  if (!checklist.priority.passed) {
    failedChecks.push("Priority must be set");
  }
  if (!checklist.estimation.passed) {
    failedChecks.push("Estimation must be entered");
  }
  if (!checklist.tests.passed) {
    failedChecks.push("Tests must be created");
  }
  if (!checklist.blockers.passed) {
    failedChecks.push("Blockers must be resolved");
  }

  const isReady = failedChecks.length === 0;

  return {
    status: isReady ? "Ready" : "Incomplete",
    isReady,
    failedChecks,
    checklist,
  };
};

const ViewStoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [useSampleData, setUseSampleData] = useState(false);
  const [readinessResult, setReadinessResult] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);

        if (id === "sample" || id === "demo") {
          setStory(getSampleStoryData());
          setUseSampleData(true);
          setLoading(false);
          return;
        }

        try {
          const storyData = await userStoriesService.getStoryById(id);
          if (storyData) {
            setStory(storyData);
            setUseSampleData(false);
          } else {
            console.warn(
              "Story not found, using sample data for demonstration"
            );
            setStory(getSampleStoryData());
            setUseSampleData(true);
          }
        } catch (fetchErr) {
          console.warn("API fetch failed, using sample data:", fetchErr);
          setStory(getSampleStoryData());
          setUseSampleData(true);
        }
      } catch (err) {
        console.error("Error fetching story:", err);
        setStory(getSampleStoryData());
        setUseSampleData(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStory();
    } else {
      setStory(getSampleStoryData());
      setUseSampleData(true);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setReadinessResult(null);
    setReadinessError(null);
  }, [story?.id]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "#e53e3e";
      case "High":
        return "#ed8936";
      case "Medium":
        return "#d69e2e";
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
      case "In Review":
        return "#4299e1";
      case "In Progress":
        return "#ed8936";
      case "To Do":
        return "#a0aec0";
      default:
        return "#718096";
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (useSampleData || id === "sample" || id === "demo") {
      showError("This is sample data. Cannot delete sample story.");
      setShowDeleteConfirm(false);
      return;
    }

    setDeleting(true);
    try {
      // Delete associated tasks first
      try {
        taskService.deleteTasksByStoryId(id);
      } catch (taskErr) {
        console.warn("Error deleting tasks for story:", taskErr);
        // Continue with story deletion even if task deletion fails
      }

      const result = await userStoriesService.deleteStory(id);
      const message = result?.message || "Story deleted successfully";
      showSuccess(message);
      navigate("/stories");
    } catch (err) {
      console.error("Error deleting story:", err);
      const errorMsg = err.message || "Failed to delete story. Please try again.";
      setError(errorMsg);
      showError(errorMsg);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleCheckReadiness = async () => {
    if (!story?.id) {
      setReadinessError("Story ID is missing.");
      return;
    }

    setReadinessLoading(true);
    setReadinessError(null);

    if (useSampleData) {
      const result = computeLocalReadiness(story);
      setReadinessResult(result);
      setReadinessLoading(false);
      return;
    }

    try {
      const result = await userStoriesService.checkReadiness(story.id);
      setReadinessResult(result);
    } catch (err) {
      console.error("Error checking readiness:", err);
      setReadinessError(
        err.message ||
          "Failed to validate readiness. Please try again in a moment."
      );
      setReadinessResult(computeLocalReadiness(story));
    } finally {
      setReadinessLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="story-view-container">
        <div className="story-view-wrapper">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading story details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !story) {
    return (
      <div className="story-view-container">
        <div className="story-view-wrapper">
          <ErrorPlaceholder
            title="Failed to Load Story"
            message={error || "Unable to load the story details. Please try again."}
            icon="⚠️"
            actionLabel="Go Back"
            onAction={() => navigate("/stories")}
          />
        </div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <div className="story-view-container">
      <div className="story-view-wrapper">
        <div className="story-header">
          <div className="story-header-top">
            <button
              onClick={() => navigate("/dashboard")}
              className="back-button"
            >
              ← Back to Dashboard
            </button>
            <div className="story-actions">
              <button
                onClick={() => navigate(`/story/create?storyId=${id}`)}
                className="edit-button"
                disabled={deleting || useSampleData}
                title={
                  useSampleData ? "Cannot edit sample data" : "Edit this story"
                }
              >
                ✏️ Edit Story
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="delete-button"
                disabled={deleting || useSampleData}
                title={
                  useSampleData
                    ? "Cannot delete sample data"
                    : "Delete this story"
                }
              >
                🗑️ Delete Story
              </button>
            </div>
          </div>
          <div className="story-title-wrapper">
            <h1 className="story-title-main">{story.title}</h1>
            {useSampleData && (
              <span className="sample-data-badge">📋 Sample Data</span>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div
            className="delete-confirm-overlay"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="delete-confirm-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Story</h3>
              <p>
                Are you sure you want to delete "{story.title}"? This action
                cannot be undone.
              </p>
              <div className="delete-confirm-buttons">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-cancel"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-delete"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="story-content">
          <section className="story-section">
            <h2 className="section-title">Story Information</h2>
            <div className="story-grid">
              <div className="info-item">
                <span className="info-label">Status</span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(story.status) }}
                >
                  {story.status}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Priority</span>
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(story.priority) }}
                >
                  {story.priority}
                </span>
              </div>
              {story.storyPoints && (
                <div className="info-item">
                  <span className="info-label">Story Points</span>
                  <span className="info-value">{story.storyPoints}</span>
                </div>
              )}
              {story.assignee && (
                <div className="info-item">
                  <span className="info-label">Assignee</span>
                  <span className="info-value">{story.assignee}</span>
                </div>
              )}
              {story.sprint && (
                <div className="info-item">
                  <span className="info-label">Sprint</span>
                  <span className="info-value">{story.sprint}</span>
                </div>
              )}
              {story.epic && (
                <div className="info-item">
                  <span className="info-label">Epic</span>
                  <span className="info-value">{story.epic}</span>
                </div>
              )}
            </div>
          </section>

          <section className="story-section readiness-section">
            <div className="readiness-header">
              <h2 className="section-title">Readiness Checklist</h2>
              <button
                className="readiness-button"
                onClick={handleCheckReadiness}
                disabled={readinessLoading || !story?.id}
              >
                {readinessLoading ? "Validating..." : "Check Readiness"}
              </button>
            </div>
            {readinessError && (
              <div className="readiness-error">{readinessError}</div>
            )}
            {readinessResult && (
              <>
                <div
                  className={`readiness-status ${
                    readinessResult.isReady ? "ready" : "incomplete"
                  }`}
                >
                  <span className="status-dot" />
                  {readinessResult.status}
                </div>
                {readinessResult.failedChecks?.length > 0 && (
                  <ul className="readiness-failures">
                    {readinessResult.failedChecks.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
                {readinessResult.checklist && (
                  <div className="readiness-grid">
                    {Object.entries(readinessResult.checklist).map(
                      ([key, item]) => (
                        <div
                          key={key}
                          className={`readiness-item ${
                            item.passed ? "pass" : "fail"
                          }`}
                        >
                          <div className="readiness-item-header">
                            <span className="readiness-item-label">
                              {readinessLabels[key] || key}
                            </span>
                            <span
                              className={`readiness-chip ${
                                item.passed ? "pass" : "fail"
                              }`}
                            >
                              {item.passed ? "Ready" : "Incomplete"}
                            </span>
                          </div>
                          <p className="readiness-item-value">
                            {typeof item.value === "boolean"
                              ? item.value
                                ? "Yes"
                                : "No"
                              : item.value ?? "—"}
                          </p>
                          {!item.passed && item.required && (
                            <p className="readiness-item-hint">Required</p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </>
            )}
            {!readinessResult && !readinessError && !readinessLoading && (
              <p className="readiness-placeholder">
                Run the checklist to validate points, priority, estimates,
                tests, blockers, and MVP tagging.
              </p>
            )}
          </section>

          <section className="story-section">
            <h2 className="section-title">Description</h2>
            <div className="story-text-content">
              <p>{story.description || "No description provided"}</p>
            </div>
          </section>

          <section className="story-section">
            <h2 className="section-title">Acceptance Criteria</h2>
            <div className="story-text-content">
              <p>
                {story.acceptanceCriteria || "No acceptance criteria provided"}
              </p>
            </div>
          </section>

          {(story.value !== null || story.effort !== null) && (
            <section className="story-section">
              <h2 className="section-title">Business Metrics</h2>
              <div className="story-grid">
                {story.value !== null && (
                  <div className="info-item">
                    <span className="info-label">Business Value</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${(story.value / 10) * 100}%` }}
                      >
                        {story.value}/10
                      </div>
                    </div>
                  </div>
                )}
                {story.effort !== null && (
                  <div className="info-item">
                    <span className="info-label">Effort</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill effort-fill"
                        style={{ width: `${(story.effort / 10) * 100}%` }}
                      >
                        {story.effort}/10
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {story.tags && story.tags.length > 0 && (
            <section className="story-section">
              <h2 className="section-title">Tags</h2>
              <div className="tags-container">
                {story.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="story-section metadata-section">
            <h2 className="section-title">Metadata</h2>
            <div className="story-grid">
              {story.id && (
                <div className="info-item">
                  <span className="info-label">Story ID</span>
                  <span className="info-value">{story.id}</span>
                </div>
              )}
              {story.createdAt && (
                <div className="info-item">
                  <span className="info-label">Created At</span>
                  <span className="info-value">
                    {new Date(story.createdAt).toLocaleString()}
                  </span>
                </div>
              )}
              {story.updatedAt && (
                <div className="info-item">
                  <span className="info-label">Updated At</span>
                  <span className="info-value">
                    {new Date(story.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Comments Section */}
          {story && story.id && (
            <section className="story-section">
              <TaskComments storyId={story.id} />
            </section>
          )}

          {/* Tasks Section */}
          {story && story.id && (
            <TaskList storyId={story.id} storyTitle={story.title} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewStoryDetails;
