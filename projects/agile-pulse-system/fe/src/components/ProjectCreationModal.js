import React, { useState } from "react";
import ErrorAlert from "./ErrorAlert";
import ValidationError from "./ValidationError";
import "./ProjectCreationModal.css";

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

const getAuthHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const ProjectCreationModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    totalStories: "",
    dueDate: "",
    color: "orange",
    titleColor: "purple",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorOptions = [
    { value: "orange", label: "Orange" },
    { value: "green", label: "Green" },
    { value: "purple", label: "Purple" },
  ];

  const titleColorOptions = [
    { value: "purple", label: "Purple" },
    { value: "orange", label: "Orange" },
    { value: "green", label: "Green" },
  ];

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
      newErrors.title = "Project title is required";
    }

    if (!formData.subtitle.trim()) {
      newErrors.subtitle = "Project subtitle is required";
    }

    if (
      !formData.totalStories ||
      isNaN(formData.totalStories) ||
      parseInt(formData.totalStories) <= 0
    ) {
      newErrors.totalStories = "Total stories must be a positive number";
    }

    if (!formData.dueDate.trim()) {
      newErrors.dueDate = "Due date is required";
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
      // Try to create project via API first
      try {
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: formData.title.trim(),
            description: formData.subtitle.trim(),
          }),
        });

        if (response.ok) {
          const createdProject = await response.json();
          console.log("Project created via API:", createdProject);

          // Convert API project format to Dashboard format
          const newProject = {
            id: createdProject.id,
            title: createdProject.name,
            subtitle: createdProject.description || "",
            completed: 0,
            total: parseInt(formData.totalStories),
            dueDate: formData.dueDate.trim(),
            color: formData.color,
            titleColor: formData.titleColor,
            isManual: false, // Created via API
          };

          onSave(newProject);

          // Reset form
          setFormData({
            title: "",
            subtitle: "",
            totalStories: "",
            dueDate: "",
            color: "orange",
            titleColor: "purple",
          });
          setErrors({});
          onClose();
          return;
        } else {
          console.warn(
            "API project creation failed, falling back to localStorage"
          );
        }
      } catch (apiError) {
        console.warn(
          "API not available, using localStorage fallback:",
          apiError
        );
      }

      // Fallback to localStorage
      const newProject = {
        id: `project-${Date.now()}`, // Unique ID
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        completed: 0,
        total: parseInt(formData.totalStories),
        dueDate: formData.dueDate.trim(),
        color: formData.color,
        titleColor: formData.titleColor,
        isManual: true, // Flag to identify manually created projects
      };

      onSave(newProject);

      // Reset form
      setFormData({
        title: "",
        subtitle: "",
        totalStories: "",
        dueDate: "",
        color: "orange",
        titleColor: "purple",
      });
      setErrors({});

      onClose();
    } catch (error) {
      console.error("Error creating project:", error);
      setErrors({ submit: "Failed to create project. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      subtitle: "",
      totalStories: "",
      dueDate: "",
      color: "orange",
      titleColor: "purple",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
          <button className="modal-close-btn" onClick={handleClose}>
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

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Project Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? "input-error" : ""}`}
              placeholder="e.g., Web App"
            />
            {errors.title && <ValidationError message={errors.title} />}
          </div>

          <div className="form-group">
            <label htmlFor="subtitle" className="form-label">
              Project Subtitle <span className="required">*</span>
            </label>
            <input
              type="text"
              id="subtitle"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className={`form-input ${errors.subtitle ? "input-error" : ""}`}
              placeholder="e.g., Project Alpha"
            />
            {errors.subtitle && <ValidationError message={errors.subtitle} />}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalStories" className="form-label">
                Total Stories <span className="required">*</span>
              </label>
              <input
                type="number"
                id="totalStories"
                name="totalStories"
                value={formData.totalStories}
                onChange={handleChange}
                className={`form-input ${
                  errors.totalStories ? "input-error" : ""
                }`}
                placeholder="12"
                min="1"
              />
              {errors.totalStories && (
                <ValidationError message={errors.totalStories} />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">
                Due Date <span className="required">*</span>
              </label>
              <input
                type="text"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`form-input ${errors.dueDate ? "input-error" : ""}`}
                placeholder="e.g., 2 weeks"
              />
              {errors.dueDate && <ValidationError message={errors.dueDate} />}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color" className="form-label">
                Gradient Color
              </label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="form-select"
              >
                {colorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="titleColor" className="form-label">
                Title Color
              </label>
              <select
                id="titleColor"
                name="titleColor"
                value={formData.titleColor}
                onChange={handleChange}
                className="form-select"
              >
                {titleColorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errors.submit && (
            <ErrorAlert
              message={errors.submit}
              onClose={() => setErrors((prev) => ({ ...prev, submit: "" }))}
              type="error"
              dismissible={true}
            />
          )}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreationModal;
