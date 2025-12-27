import React, { useState, useEffect } from "react";
import taskService from "../services/taskService";
import authService from "../services/authService";
import "./TaskCreationModal.css";

const TaskCreationModal = ({ isOpen, onClose, storyId, onTaskCreated }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    assigneeId: "",
    dueDate: "",
    estimatedHours: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersList = await authService.getUsersForAssignment();
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (formData.estimatedHours && isNaN(formData.estimatedHours)) {
      newErrors.estimatedHours = "Estimated hours must be a number";
    }

    if (formData.estimatedHours && parseFloat(formData.estimatedHours) < 0) {
      newErrors.estimatedHours = "Estimated hours cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId || null,
        storyId: storyId || null,
        dueDate: formData.dueDate || null,
        estimatedHours: formData.estimatedHours
          ? parseFloat(formData.estimatedHours)
          : null,
      };

      const createdTask = await taskService.createTask(taskData);

      if (createdTask && onTaskCreated) {
        onTaskCreated(createdTask);
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        status: "To Do",
        priority: "Medium",
        assigneeId: "",
        dueDate: "",
        estimatedHours: "",
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      alert(
        `Failed to create task: ${error.message || "Please try again."}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      status: "To Do",
      priority: "Medium",
      assigneeId: "",
      dueDate: "",
      estimatedHours: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="task-modal-overlay" onClick={handleClose}>
      <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h2 className="task-modal-title">Create New Task</h2>
          <button className="task-modal-close-btn" onClick={handleClose}>
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

        <form onSubmit={handleSubmit} className="task-form">
          <div className="task-form-group">
            <label htmlFor="title" className="task-form-label">
              Task Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`task-form-input ${
                errors.title ? "input-error" : ""
              }`}
              placeholder="e.g., Implement user authentication"
            />
            {errors.title && (
              <span className="task-error-message">{errors.title}</span>
            )}
          </div>

          <div className="task-form-group">
            <label htmlFor="description" className="task-form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="task-form-textarea"
              placeholder="Task description..."
              rows="4"
            />
          </div>

          <div className="task-form-row">
            <div className="task-form-group">
              <label htmlFor="status" className="task-form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="task-form-select"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Done">Done</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div className="task-form-group">
              <label htmlFor="priority" className="task-form-label">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="task-form-select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="task-form-row">
            <div className="task-form-group">
              <label htmlFor="assigneeId" className="task-form-label">
                Assignee
              </label>
              <select
                id="assigneeId"
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                className="task-form-select"
                disabled={loadingUsers}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="task-form-group">
              <label htmlFor="estimatedHours" className="task-form-label">
                Estimated Hours
              </label>
              <input
                type="number"
                id="estimatedHours"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                className={`task-form-input ${
                  errors.estimatedHours ? "input-error" : ""
                }`}
                placeholder="e.g., 8"
                min="0"
                step="0.5"
              />
              {errors.estimatedHours && (
                <span className="task-error-message">
                  {errors.estimatedHours}
                </span>
              )}
            </div>
          </div>

          <div className="task-form-group">
            <label htmlFor="dueDate" className="task-form-label">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="task-form-input"
            />
          </div>

          <div className="task-form-actions">
            <button
              type="button"
              className="task-btn task-btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="task-btn task-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreationModal;

