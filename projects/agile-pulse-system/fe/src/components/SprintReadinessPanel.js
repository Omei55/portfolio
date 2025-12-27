import React, { useMemo } from "react";
import "./SprintReadinessPanel.css";

/**
 * Sprint Readiness Panel Component
 * Displays sprint readiness status, score, and issues
 */
const SprintReadinessPanel = ({ sprint, stories = [] }) => {
  // Calculate readiness metrics
  const readinessData = useMemo(() => {
    if (!sprint || !stories || stories.length === 0) {
      return {
        status: "Not Ready",
        statusColor: "#e53e3e",
        score: 0,
        maxScore: 100,
        issues: [
          {
            type: "warning",
            message: "No stories assigned to this sprint",
            priority: "high",
          },
        ],
      };
    }

    const issues = [];
    let score = 100;
    let totalPoints = 0;

    // Check for stories without story points
    const storiesWithoutPoints = stories.filter(
      (story) => !story.storyPoints || story.storyPoints === 0
    );
    if (storiesWithoutPoints.length > 0) {
      issues.push({
        type: "warning",
        message: `${storiesWithoutPoints.length} story/stories missing story points`,
        priority: "medium",
        count: storiesWithoutPoints.length,
      });
      score -= storiesWithoutPoints.length * 5;
    }

    // Check for unassigned stories
    const unassignedStories = stories.filter(
      (story) => !story.assignee || story.assignee.trim() === ""
    );
    if (unassignedStories.length > 0) {
      issues.push({
        type: "warning",
        message: `${unassignedStories.length} unassigned story/stories`,
        priority: "medium",
        count: unassignedStories.length,
      });
      score -= unassignedStories.length * 3;
    }

    // Check for stories without acceptance criteria
    const storiesWithoutCriteria = stories.filter(
      (story) =>
        !story.acceptanceCriteria ||
        story.acceptanceCriteria.trim() === ""
    );
    if (storiesWithoutCriteria.length > 0) {
      issues.push({
        type: "info",
        message: `${storiesWithoutCriteria.length} story/stories missing acceptance criteria`,
        priority: "low",
        count: storiesWithoutCriteria.length,
      });
      score -= storiesWithoutCriteria.length * 2;
    }

    // Check for high priority stories in "To Do" status
    const highPriorityTodo = stories.filter(
      (story) =>
        (story.priority === "High" || story.priority === "Critical") &&
        story.status === "To Do"
    );
    if (highPriorityTodo.length > 0) {
      issues.push({
        type: "error",
        message: `${highPriorityTodo.length} high/critical priority story/stories still in "To Do"`,
        priority: "high",
        count: highPriorityTodo.length,
      });
      score -= highPriorityTodo.length * 10;
    }

    // Calculate total story points
    totalPoints = stories.reduce((sum, story) => {
      return sum + (story.storyPoints || 0);
    }, 0);

    // Check if sprint has reasonable story points (between 10 and 50)
    if (totalPoints === 0) {
      issues.push({
        type: "error",
        message: "Sprint has no story points assigned",
        priority: "high",
      });
      score -= 20;
    } else if (totalPoints < 10) {
      issues.push({
        type: "warning",
        message: `Low story points total (${totalPoints}). Consider adding more stories.`,
        priority: "low",
      });
      score -= 5;
    } else if (totalPoints > 50) {
      issues.push({
        type: "warning",
        message: `High story points total (${totalPoints}). Sprint may be overloaded.`,
        priority: "medium",
      });
      score -= 10;
    }

    // Check for stories already in "Done" status (might indicate sprint already started)
    const doneStories = stories.filter((story) => story.status === "Done");
    const donePercentage = (doneStories.length / stories.length) * 100;
    if (donePercentage > 50 && donePercentage < 100) {
      issues.push({
        type: "info",
        message: `${Math.round(donePercentage)}% of stories already completed`,
        priority: "low",
      });
    }

    // Determine status
    let status = "Ready";
    let statusColor = "#48bb78"; // Green

    if (score < 60) {
      status = "Not Ready";
      statusColor = "#e53e3e"; // Red
    } else if (score < 80) {
      status = "At Risk";
      statusColor = "#ed8936"; // Orange
    } else if (score < 95) {
      status = "Almost Ready";
      statusColor = "#f6ad55"; // Light orange
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
      status,
      statusColor,
      score: Math.round(score),
      maxScore: 100,
      totalPoints,
      issues: issues.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (
          (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        );
      }),
    };
  }, [sprint, stories]);

  const { status, statusColor, score, maxScore, totalPoints, issues } =
    readinessData;

  return (
    <div className="sprint-readiness-panel">
      <div className="readiness-header">
        <h3 className="readiness-title">Sprint Readiness</h3>
        <div
          className="readiness-status-badge"
          style={{ backgroundColor: statusColor }}
        >
          {status}
        </div>
      </div>

      <div className="readiness-score-section">
        <div className="score-display">
          <div className="score-value">{score}</div>
          <div className="score-max">/{maxScore}</div>
        </div>
        <div className="score-bar-container">
          <div
            className="score-bar-fill"
            style={{
              width: `${score}%`,
              backgroundColor: statusColor,
            }}
          ></div>
        </div>
        <div className="score-label">Readiness Score</div>
      </div>

      {totalPoints > 0 && (
        <div className="readiness-stats">
          <div className="readiness-stat-item">
            <span className="stat-label">Total Story Points:</span>
            <span className="stat-value">{totalPoints}</span>
          </div>
          <div className="readiness-stat-item">
            <span className="stat-label">Total Stories:</span>
            <span className="stat-value">{stories.length}</span>
          </div>
        </div>
      )}

      <div className="readiness-issues-section">
        <h4 className="issues-title">
          {issues.length === 0
            ? "✅ No Issues"
            : `Issues (${issues.length})`}
        </h4>
        {issues.length === 0 ? (
          <div className="no-issues-message">
            <p>Sprint is ready to start!</p>
          </div>
        ) : (
          <div className="issues-list">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={`issue-item issue-${issue.type} issue-priority-${issue.priority}`}
              >
                <div className="issue-icon">
                  {issue.type === "error" && "🔴"}
                  {issue.type === "warning" && "⚠️"}
                  {issue.type === "info" && "ℹ️"}
                </div>
                <div className="issue-content">
                  <div className="issue-message">{issue.message}</div>
                  {issue.count && (
                    <div className="issue-count">
                      {issue.count} {issue.count === 1 ? "story" : "stories"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintReadinessPanel;

