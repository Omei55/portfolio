/**
 * Task Board Component (Kanban Board)
 * Displays tasks in a Kanban board layout grouped by status
 */

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userStoriesService from "../services/userStoriesService";
import taskService from "../services/taskService";
import "./TaskBoard.css";

const TaskBoard = () => {
  const { user, logout } = useAuth();
  const [stories, setStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null); // 'story' or 'task'
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Status columns for Kanban board - All 5 status options including Blocked
  const statusColumns = [
    "To Do",
    "In Progress",
    "In Review",
    "Done",
    "Blocked",
  ];

  // Fetch stories and tasks on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storiesData, tasksData] = await Promise.all([
        userStoriesService.getAllStories(),
        taskService.getAllTasks(),
      ]);
      const storiesArray = Array.isArray(storiesData) ? storiesData : [];
      const tasksArray = Array.isArray(tasksData) ? tasksData : [];
      console.log(
        "TaskBoard: Loaded stories:",
        storiesArray.length,
        storiesArray
      );
      console.log("TaskBoard: Loaded tasks:", tasksArray.length, tasksArray);
      setStories(storiesArray);
      setTasks(tasksArray);
    } catch (error) {
      console.error("Error loading data:", error);
      setStories([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async () => {
    try {
      const data = await userStoriesService.getAllStories();
      setStories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading stories:", error);
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

  // Get unique assignees from stories and tasks
  const assignees = useMemo(() => {
    const assigneeSet = new Set();
    stories.forEach((story) => {
      if (story.assignee) {
        assigneeSet.add(story.assignee);
      }
    });
    tasks.forEach((task) => {
      const assignee = task.assigneeId || task.assignee;
      if (assignee) {
        assigneeSet.add(assignee);
      }
    });
    return ["all", ...Array.from(assigneeSet)];
  }, [stories, tasks]);

  // Group tasks by their parent stories
  const tasksByStory = useMemo(() => {
    const grouped = {};
    if (!tasks || tasks.length === 0) {
      return grouped;
    }
    tasks.forEach((task) => {
      const storyId = task.storyId || task.story_id;
      if (storyId) {
        if (!grouped[storyId]) {
          grouped[storyId] = [];
        }
        grouped[storyId].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // Filter and group stories and tasks by status
  const filteredTasksByStatus = useMemo(() => {
    let filteredStories = [...stories];
    let filteredTasks = [...tasks];

    // Filter stories by project
    if (selectedProject !== "all") {
      filteredStories = filteredStories.filter((story) => {
        const project = story.epic || story.sprint || "Backlog";
        return project === selectedProject;
      });
    }

    // Filter tasks by project (via their parent story)
    if (selectedProject !== "all") {
      filteredTasks = filteredTasks.filter((task) => {
        const parentStory = stories.find(
          (s) => s.id === (task.storyId || task.story_id)
        );
        if (!parentStory) return false;
        const project = parentStory.epic || parentStory.sprint || "Backlog";
        return project === selectedProject;
      });
    }

    // Filter by assignee
    if (filterAssignee !== "all") {
      filteredStories = filteredStories.filter(
        (story) => story.assignee === filterAssignee
      );
      filteredTasks = filteredTasks.filter((task) => {
        const assignee = task.assigneeId || task.assignee;
        return assignee === filterAssignee;
      });
    }

    // Filter by status (if not showing all)
    if (filterStatus !== "all") {
      filteredStories = filteredStories.filter(
        (story) => story.status === filterStatus
      );
      filteredTasks = filteredTasks.filter(
        (task) => task.status === filterStatus
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredStories = filteredStories.filter((story) => {
        const titleMatch = story.title?.toLowerCase().includes(query);
        const descMatch = story.description?.toLowerCase().includes(query);
        const assigneeMatch = story.assignee?.toLowerCase().includes(query);
        return titleMatch || descMatch || assigneeMatch;
      });
      filteredTasks = filteredTasks.filter((task) => {
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        return titleMatch || descMatch;
      });
    }

    // Group by status - Initialize with all 5 status options including Blocked
    const grouped = {
      "To Do": { stories: [], tasks: [] },
      "In Progress": { stories: [], tasks: [] },
      "In Review": { stories: [], tasks: [] },
      Done: { stories: [], tasks: [] },
      Blocked: { stories: [], tasks: [] },
    };

    // Group stories by status
    filteredStories.forEach((story) => {
      const status = story.status || "To Do";
      if (grouped[status]) {
        grouped[status].stories.push(story);
      } else {
        grouped["To Do"].stories.push(story);
      }
    });

    // Group tasks by status
    filteredTasks.forEach((task) => {
      const status = task.status || "To Do";
      if (grouped[status]) {
        grouped[status].tasks.push(task);
      } else {
        grouped["To Do"].tasks.push(task);
      }
    });

    return grouped;
  }, [
    stories,
    tasks,
    selectedProject,
    filterAssignee,
    filterStatus,
    searchQuery,
  ]);

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

  const handleDragStart = (e, item, type = "story") => {
    setDraggedItem(item);
    setDraggedItemType(type);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", item.id);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ id: item.id, type })
    );
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    setDraggedItemType(null);
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

  const showFeedback = (message, type = "success") => {
    setFeedbackMessage({ message, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedItem || !draggedItemType) {
      return;
    }

    // Don't update if dropped in the same column
    if (draggedItem.status === targetStatus) {
      setDraggedItem(null);
      setDraggedItemType(null);
      return;
    }

    try {
      if (draggedItemType === "story") {
        // Update story status via API
        await userStoriesService.updateStory(draggedItem.id, {
          ...draggedItem,
          status: targetStatus,
        });
        await loadStories();
        showFeedback(
          `Story "${draggedItem.title}" moved to ${targetStatus}`,
          "success"
        );
      } else if (draggedItemType === "task") {
        // Update task status via API
        await taskService.updateTaskStatus(draggedItem.id, targetStatus);
        await loadData();
        showFeedback(
          `Task "${draggedItem.title}" moved to ${targetStatus}`,
          "success"
        );
      }
    } catch (error) {
      console.error(`Failed to update ${draggedItemType} status:`, error);
      showFeedback(
        `Failed to update ${draggedItemType} status. Please try again.`,
        "error"
      );
    } finally {
      setDraggedItem(null);
      setDraggedItemType(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const allItems = [];
      
      // Collect all stories
      stories.forEach((story) => {
        allItems.push({
          type: "Story",
          title: story.title,
          description: story.description || "",
          status: story.status || "To Do",
          priority: story.priority || "Medium",
          assignee: story.assignee || "",
          sprint: story.sprint || "",
          epic: story.epic || "",
        });
      });

      // Collect all tasks
      tasks.forEach((task) => {
        allItems.push({
          type: "Task",
          title: task.title,
          description: task.description || "",
          status: task.status || "To Do",
          priority: task.priority || "Medium",
          assignee: task.assigneeId || task.assignee || "",
          storyId: task.storyId || task.story_id || "",
        });
      });

      // Convert to CSV
      const headers = ["Type", "Title", "Description", "Status", "Priority", "Assignee", "Sprint/Epic", "Story ID"];
      const csvRows = [
        headers.join(","),
        ...allItems.map((item) =>
          [
            item.type,
            `"${(item.title || "").replace(/"/g, '""')}"`,
            `"${(item.description || "").replace(/"/g, '""')}"`,
            item.status,
            item.priority,
            item.assignee,
            item.sprint || item.epic || "",
            item.storyId || "",
          ].join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `task-board-export-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showFeedback("Board data exported to CSV successfully!", "success");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      showFeedback("Failed to export data. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        stories: stories.map((story) => ({
          id: story.id,
          title: story.title,
          description: story.description,
          status: story.status,
          priority: story.priority,
          assignee: story.assignee,
          sprint: story.sprint,
          epic: story.epic,
          storyPoints: story.storyPoints,
          createdAt: story.createdAt,
          updatedAt: story.updatedAt,
        })),
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId || task.assignee,
          storyId: task.storyId || task.story_id,
          projectId: task.projectId || task.project_id,
          sprintId: task.sprintId || task.sprint_id,
          dueDate: task.dueDate || task.due_date,
          estimatedHours: task.estimatedHours || task.estimated_hours,
          actualHours: task.actualHours || task.actual_hours,
          createdAt: task.createdAt || task.created_at,
          updatedAt: task.updatedAt || task.updated_at,
        })),
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `task-board-export-${new Date().toISOString().split("T")[0]}.json`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showFeedback("Board data exported to JSON successfully!", "success");
    } catch (error) {
      console.error("Error exporting to JSON:", error);
      showFeedback("Failed to export data. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
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
          <div className="header-actions">
            <div className="export-buttons">
              <button
                onClick={exportToCSV}
                className="export-btn export-csv-btn"
                disabled={isExporting}
                title="Export to CSV"
              >
                {isExporting ? "Exporting..." : "📥 Export CSV"}
              </button>
              <button
                onClick={exportToJSON}
                className="export-btn export-json-btn"
                disabled={isExporting}
                title="Export to JSON"
              >
                {isExporting ? "Exporting..." : "📥 Export JSON"}
              </button>
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
        </div>
      </header>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`feedback-message feedback-${feedbackMessage.type}`}>
          <span className="feedback-text">{feedbackMessage.message}</span>
          <button
            className="feedback-close"
            onClick={() => setFeedbackMessage(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  showFeedback(
                    `Searching for "${e.target.value}"...`,
                    "info"
                  );
                }
              }}
              className="search-input"
            />
          </div>
        </div>

        {/* Kanban Board */}
        <div className="kanban-board">
          {statusColumns.map((status) => {
            const columnData = filteredTasksByStatus[status] || {
              stories: [],
              tasks: [],
            };
            const storiesInColumn = columnData.stories || [];
            const tasksInColumn = columnData.tasks || [];
            const totalCount = storiesInColumn.length + tasksInColumn.length;
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
                  <span className="column-count">{totalCount}</span>
                </div>
                <div className="column-content">
                  {totalCount === 0 ? (
                    <div className="empty-column">No items</div>
                  ) : (
                    <>
                      {/* Render Stories */}
                      {storiesInColumn.map((story) => {
                        // Get all tasks for this story, regardless of status
                        // Tasks will be shown in their own status columns
                        const storyTasks = tasksByStory[story.id] || [];
                        // Only show tasks that match the current column status
                        const filteredStoryTasks = storyTasks.filter((task) => {
                          const taskStatus = task.status || "To Do";
                          return taskStatus === status;
                        });

                        return (
                          <div
                            key={`story-${story.id}`}
                            className="story-card-wrapper"
                          >
                            <div
                              className={`story-card ${
                                draggedItem?.id === story.id &&
                                draggedItemType === "story"
                                  ? "dragging"
                                  : ""
                              }`}
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, story, "story")
                              }
                              onDragEnd={handleDragEnd}
                            >
                              <div className="story-card-header">
                                <h3 className="story-title">{story.title}</h3>
                                <div className="story-badges">
                                  <span
                                    className="priority-badge"
                                    style={{
                                      backgroundColor: getPriorityColor(
                                        story.priority
                                      ),
                                    }}
                                  >
                                    {story.priority || "Medium"}
                                  </span>
                                  <span
                                    className="status-badge"
                                    style={{
                                      backgroundColor: getStatusColor(
                                        story.status
                                      ),
                                    }}
                                  >
                                    Story
                                  </span>
                                </div>
                              </div>
                              <div className="story-card-body">
                                {story.description && (
                                  <div className="story-description">
                                    {story.description.substring(0, 80)}
                                    {story.description.length > 80 ? "..." : ""}
                                  </div>
                                )}
                              </div>
                              <div className="story-card-footer">
                                <Link
                                  to={`/story/${story.id}`}
                                  className="view-story-link"
                                  onClick={(e) => {
                                    if (draggedItem) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  View Story →
                                </Link>
                              </div>
                            </div>

                            {/* Render Tasks as children of Story */}
                            {filteredStoryTasks.length > 0 && (
                              <div className="story-tasks-container">
                                {filteredStoryTasks.map((task) => (
                                  <div
                                    key={`task-${task.id}`}
                                    className={`task-card task-child ${
                                      draggedItem?.id === task.id &&
                                      draggedItemType === "task"
                                        ? "dragging"
                                        : ""
                                    }`}
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      handleDragStart(e, task, "task");
                                    }}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="task-card-header">
                                      <h4 className="task-title">
                                        {task.title}
                                      </h4>
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
                                      </div>
                                    </div>
                                    <div className="task-card-body">
                                      {task.assignee && (
                                        <div className="task-assignee">
                                          <span className="assignee-label">
                                            Assignee:
                                          </span>
                                          <span className="assignee-value">
                                            {task.assignee}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="task-card-footer">
                                      <Link
                                        to={`/story/${
                                          task.storyId ||
                                          task.story_id ||
                                          story.id
                                        }`}
                                        className="view-story-link"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (draggedItem) {
                                            e.preventDefault();
                                          }
                                        }}
                                      >
                                        View Task →
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Render standalone tasks (tasks without a parent story or tasks whose parent story is not in this column) */}
                      {tasksInColumn
                        .filter((task) => {
                          const storyId = task.storyId || task.story_id;
                          // Show task as standalone if:
                          // 1. It has no storyId, OR
                          // 2. Its parent story is not in the current column
                          if (!storyId) return true;
                          const parentStoryInColumn = storiesInColumn.find(
                            (s) => s.id === storyId
                          );
                          return !parentStoryInColumn;
                        })
                        .map((task) => (
                          <div
                            key={`task-${task.id}`}
                            className={`task-card ${
                              draggedItem?.id === task.id &&
                              draggedItemType === "task"
                                ? "dragging"
                                : ""
                            }`}
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(e, task, "task")
                            }
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
                                    backgroundColor: getStatusColor(
                                      task.status
                                    ),
                                  }}
                                >
                                  {task.status || "To Do"}
                                </span>
                              </div>
                            </div>
                            <div className="task-card-body">
                              {task.assignee && (
                                <div className="task-assignee">
                                  <span className="assignee-label">
                                    Assignee:
                                  </span>
                                  <span className="assignee-value">
                                    {task.assignee}
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
                                to={`/story/${
                                  task.storyId || task.story_id || "unknown"
                                }`}
                                className="view-story-link"
                                onClick={(e) => {
                                  if (draggedItem) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                View Details →
                              </Link>
                            </div>
                          </div>
                        ))}
                    </>
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
