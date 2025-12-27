/**
 * Task Board Component (Kanban Board)
 * Displays tasks in a Kanban board layout grouped by status
 */

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userStoriesService from "../services/userStoriesService";
import "./TaskBoard.css";

const TaskBoard = () => {
  const { user, logout } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Status columns for Kanban board - All 5 status options including Blocked
  const statusColumns = [
    "To Do",
    "In Progress",
    "In Review",
    "Done",
    "Blocked",
  ];

  // Fetch stories on component mount
  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await userStoriesService.getAllStories();
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique projects from stories
  const projects = useMemo(() => {
    const projectSet = new Set();
    stories.forEach((story) => {
      const project = story.epic || story.sprint || "Backlog";
      projectSet.add(project);
    });
    return ["all", ...Array.from(projectSet)];
  }, [stories]);

  // Get unique assignees from stories
  const assignees = useMemo(() => {
    const assigneeSet = new Set();
    stories.forEach((story) => {
      if (story.assignee) {
        assigneeSet.add(story.assignee);
      }
    });
    return ["all", ...Array.from(assigneeSet)];
  }, [stories]);

  // Filter and group tasks by status
  const filteredTasksByStatus = useMemo(() => {
    let filtered = [...stories];

    // Filter by project
    if (selectedProject !== "all") {
      filtered = filtered.filter((story) => {
        const project = story.epic || story.sprint || "Backlog";
        return project === selectedProject;
      });
    }

    // Filter by assignee
    if (filterAssignee !== "all") {
      filtered = filtered.filter((story) => story.assignee === filterAssignee);
    }

    // Filter by status (if not showing all)
    if (filterStatus !== "all") {
      filtered = filtered.filter((story) => story.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((story) => {
        const titleMatch = story.title?.toLowerCase().includes(query);
        const descMatch = story.description?.toLowerCase().includes(query);
        const assigneeMatch = story.assignee?.toLowerCase().includes(query);
        return titleMatch || descMatch || assigneeMatch;
      });
    }

    // Group by status - Initialize with all 5 status options including Blocked
    const grouped = {
      "To Do": [],
      "In Progress": [],
      "In Review": [],
      Done: [],
      Blocked: [],
    };

    filtered.forEach((story) => {
      const status = story.status || "To Do";
      if (grouped[status]) {
        grouped[status].push(story);
      } else {
        // If status doesn't match standard columns, add to "To Do"
        grouped["To Do"].push(story);
      }
    });

    return grouped;
  }, [stories, selectedProject, filterAssignee, filterStatus, searchQuery]);

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
      case "Blocked":
        return "#e53e3e";
      case "To Do":
        return "#cbd5e0";
      default:
        return "#718096";
    }
  };

  const handleDragStart = (e, story) => {
    setDraggedItem(story);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", story.id);
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = (e) => {
    // Only clear dragOverColumn if we're leaving the column area
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedItem) {
      return;
    }

    // Don't update if dropped in the same column
    if (draggedItem.status === targetStatus) {
      setDraggedItem(null);
      return;
    }

    try {
      // Update story status via API
      await userStoriesService.updateStory(draggedItem.id, {
        ...draggedItem,
        status: targetStatus,
      });

      // Reload stories to reflect the change
      await loadStories();
    } catch (error) {
      console.error("Failed to update story status:", error);
      alert("Failed to update story status. Please try again.");
    } finally {
      setDraggedItem(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="task-board-container">
        <div className="loading">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="task-board-container">
      <header className="task-board-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/dashboard" className="back-link">
              ← Dashboard
            </Link>
            <h1>Task Board</h1>
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

      <main className="task-board-main">
        {/* Filters Section */}
        <div className="task-board-filters">
          <div className="filter-group">
            <label htmlFor="project-filter">Project:</label>
            <select
              id="project-filter"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Projects</option>
              {projects
                .filter((p) => p !== "all")
                .map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="assignee-filter">Assignee:</label>
            <select
              id="assignee-filter"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Assignees</option>
              {assignees
                .filter((a) => a !== "all")
                .map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              {statusColumns.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group search-group">
            <label htmlFor="search-input">Search:</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Kanban Board */}
        <div className="kanban-board">
          {statusColumns.map((status) => {
            const tasks = filteredTasksByStatus[status] || [];
            const isDragOver = dragOverColumn === status;
            return (
              <div
                key={status}
                className={`kanban-column ${isDragOver ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="column-header">
                  <h2 className="column-title">{status}</h2>
                  <span className="column-count">{tasks.length}</span>
                </div>
                <div className="column-content">
                  {tasks.length === 0 ? (
                    <div className="empty-column">No tasks</div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`task-card ${
                          draggedItem?.id === task.id ? "dragging" : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="task-card-header">
                          <h3 className="task-title">{task.title}</h3>
                          <div className="task-badges">
                            <span
                              className="priority-badge"
                              style={{
                                backgroundColor: getPriorityColor(
                                  task.priority
                                ),
                              }}
                            >
                              {task.priority || "Medium"}
                            </span>
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: getStatusColor(task.status),
                              }}
                            >
                              {task.status || "To Do"}
                            </span>
                          </div>
                        </div>
                        <div className="task-card-body">
                          {task.assignee && (
                            <div className="task-assignee">
                              <span className="assignee-label">Assignee:</span>
                              <span className="assignee-value">
                                {task.assignee}
                              </span>
                            </div>
                          )}
                          {task.storyPoints && (
                            <div className="task-points">
                              <span className="points-label">Points:</span>
                              <span className="points-value">
                                {task.storyPoints}
                              </span>
                            </div>
                          )}
                          {task.description && (
                            <div className="task-description">
                              {task.description.substring(0, 100)}
                              {task.description.length > 100 ? "..." : ""}
                            </div>
                          )}
                        </div>
                        <div className="task-card-footer">
                          <Link
                            to={`/story/${task.id}`}
                            className="view-story-link"
                            onClick={(e) => {
                              // Prevent navigation if we're dragging
                              if (draggedItem) {
                                e.preventDefault();
                              }
                            }}
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default TaskBoard;
