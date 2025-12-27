import React, { useState, useEffect } from "react";
import taskService from "../services/taskService";
import TaskComments from "./TaskComments";
import TaskCreationModal from "./TaskCreationModal";
import authService from "../services/authService";
import sprintService from "../services/sprintService";
import ErrorPlaceholder from "./ErrorPlaceholder";
import { useNotification } from "../context/NotificationContext";
import "./TaskList.css";

const TaskList = ({ storyId, storyTitle }) => {
  const { showSuccess, showError } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState(null);
  const [assigningSprintTaskId, setAssigningSprintTaskId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    if (storyId) {
      loadTasks();
    }
  }, [storyId]);

  useEffect(() => {
    loadUsers();
    loadSprints();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const storyTasks = await taskService.getTasksByStoryId(storyId);
      setTasks(Array.isArray(storyTasks) ? storyTasks : []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersList = await authService.getUsersForAssignment();
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      // Don't show error to user, just log it
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSprints = async () => {
    try {
      setLoadingSprints(true);
      const sprintsList = await sprintService.getAllSprints();
      setSprints(Array.isArray(sprintsList) ? sprintsList : []);
    } catch (err) {
      console.error("Failed to load sprints:", err);
      // Don't show error to user, just log it
    } finally {
      setLoadingSprints(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      showSuccess("Task status updated successfully");
      await loadTasks(); // Reload tasks
    } catch (err) {
      console.error("Failed to update task status:", err);
      showError(err.message || "Failed to update task status. Please try again.");
    }
  };

  const handleDeleteClick = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      const result = await taskService.deleteTask(taskToDelete);
      const message = result?.message || "Task deleted successfully";
      showSuccess(message);
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      await loadTasks(); // Reload tasks
    } catch (err) {
      console.error("Failed to delete task:", err);
      showError(err.message || "Failed to delete task. Please try again.");
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
  };

  const handleAssignTask = async (taskId, assigneeId) => {
    try {
      setAssigningTaskId(taskId);
      if (assigneeId) {
        await taskService.assignTask(taskId, assigneeId);
        showSuccess("Task assigned successfully");
      } else {
        await taskService.unassignTask(taskId);
        showSuccess("Task unassigned successfully");
      }
      await loadTasks(); // Reload tasks
    } catch (err) {
      console.error("Failed to assign task:", err);
      showError(err.message || "Failed to assign task. Please try again.");
    } finally {
      setAssigningTaskId(null);
    }
  };

  const handleAssignTaskToSprint = async (taskId, sprintId) => {
    try {
      setAssigningSprintTaskId(taskId);
      if (sprintId) {
        await taskService.assignTaskToSprint(taskId, sprintId);
        showSuccess("Task assigned to sprint successfully");
      } else {
        await taskService.unassignTaskFromSprint(taskId);
        showSuccess("Task unassigned from sprint successfully");
      }
      await loadTasks(); // Reload tasks
    } catch (err) {
      console.error("Failed to assign task to sprint:", err);
      showError(err.message || "Failed to assign task to sprint. Please try again.");
    } finally {
      setAssigningSprintTaskId(null);
    }
  };

  const getUserName = (userId) => {
    if (!userId) return "Unassigned";
    const user = users.find((u) => u.id === userId);
    return user ? user.fullName || user.email : userId;
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

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
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

  if (loading) {
    return (
      <div className="task-list-container">
        <div className="loading-state">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-list-container">
        <ErrorPlaceholder
          title="Failed to Load Tasks"
          message={error}
          icon="⚠️"
          actionLabel="Retry"
          onAction={loadTasks}
        />
      </div>
    );
  }

  const handleTaskCreated = async (newTask) => {
    await loadTasks();
  };

  return (
    <div className="task-list-container">
      <TaskCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        storyId={storyId}
        onTaskCreated={handleTaskCreated}
      />
      <div className="task-list-header">
        <div className="task-list-header-left">
          <h3 className="task-list-title">Tasks for Story</h3>
          <span className="task-count">{tasks.length} task(s)</span>
        </div>
        <button
          className="create-task-btn"
          onClick={() => setIsCreateModalOpen(true)}
          title="Create new task"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3V13M3 8H13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Create Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-tasks-message">
          <p>No tasks created for this story yet.</p>
          <p className="empty-tasks-hint">
            A task is automatically created when a story is created.
          </p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-main-content">
                <div className="task-header-row">
                  <h4 className="task-item-title">{task.title}</h4>
                  <div className="task-badges">
                    <span
                      className="task-priority-badge"
                      style={{
                        backgroundColor: getPriorityColor(task.priority),
                      }}
                    >
                      {task.priority}
                    </span>
                    <select
                      className="task-status-select"
                      value={task.status || "To Do"}
                      onChange={(e) =>
                        handleTaskStatusChange(task.id, e.target.value)
                      }
                      style={{
                        backgroundColor: getStatusColor(task.status || "To Do"),
                        color: "white",
                      }}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Done">Done</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                  <div className="task-assignment-wrapper">
                    <label className="task-assignment-label">
                      <strong>Assigned to:</strong>
                    </label>
                    <select
                      className="task-assignment-select"
                      value={task.assigneeId || task.assignee || ""}
                      onChange={(e) =>
                        handleAssignTask(task.id, e.target.value || null)
                      }
                      disabled={assigningTaskId === task.id || loadingUsers}
                      title="Assign task to a team member"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName || user.email}
                        </option>
                      ))}
                    </select>
                    {assigningTaskId === task.id && (
                      <span className="assigning-indicator">Assigning...</span>
                    )}
                  </div>
                  <div className="task-assignment-wrapper">
                    <label className="task-assignment-label">
                      <strong>Sprint:</strong>
                    </label>
                    <select
                      className="task-assignment-select"
                      value={task.sprintId || task.sprint_id || ""}
                      onChange={(e) =>
                        handleAssignTaskToSprint(
                          task.id,
                          e.target.value || null
                        )
                      }
                      disabled={
                        assigningSprintTaskId === task.id || loadingSprints
                      }
                      title="Assign task to a sprint"
                    >
                      <option value="">Unassigned</option>
                      {sprints.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </option>
                      ))}
                    </select>
                    {assigningSprintTaskId === task.id && (
                      <span className="assigning-indicator">Assigning...</span>
                    )}
                  </div>
                  {task.estimatedHours && (
                    <span className="task-meta-item">
                      <strong>Estimated:</strong> {task.estimatedHours} hours
                    </span>
                  )}
                  {task.actualHours && (
                    <span className="task-meta-item">
                      <strong>Actual:</strong> {task.actualHours} hours
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="task-meta-item">
                      <strong>Due:</strong>{" "}
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <button
                  className="task-comments-toggle"
                  onClick={() => toggleTaskExpansion(task.id)}
                  title={
                    expandedTasks.has(task.id)
                      ? "Hide comments"
                      : "Show comments"
                  }
                >
                  {expandedTasks.has(task.id)
                    ? "▼ Hide Comments"
                    : "▶ Show Comments"}
                </button>
              </div>

              <button
                className="task-delete-btn"
                onClick={() => handleDeleteClick(task.id)}
                title="Delete task"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {expandedTasks.has(task.id) && (
                <div className="task-comments-wrapper">
                  <TaskComments
                    storyId={storyId}
                    taskId={task.id}
                    taskTitle={task.title}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content modal-content-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Task</h3>
              <button
                className="modal-close"
                onClick={handleDeleteCancel}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="delete-confirmation-content">
              <p className="delete-confirmation-text">
                Are you sure you want to delete this task?
              </p>
              <p className="delete-confirmation-warning">
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
