import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import userStoriesService from "../services/userStoriesService";
import taskService from "../services/taskService";
import sprintService from "../services/sprintService";
import authService from "../services/authService";
import ErrorAlert from "./ErrorAlert";
import ValidationError from "./ValidationError";
import ErrorPlaceholder from "./ErrorPlaceholder";
import "./StoryCreationForm.css";

const INITIAL_FORM_STATE = {
  title: "",
  description: "",
  acceptanceCriteria: "",
  priority: "Medium",
  storyPoints: "",
  assignee: "",
  status: "To Do",
  sprint: "",
  epic: "",
  tags: "",
  value: "",
  effort: "",
};

const StoryCreationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const storyIdParam = searchParams.get("storyId");

  const [formData, setFormData] = useState({ ...INITIAL_FORM_STATE });
  const [originalFormData, setOriginalFormData] = useState(null);
  const [currentStoryId, setCurrentStoryId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const mapStoryToFormData = (story) => ({
    title: story.title || "",
    description: story.description || "",
    acceptanceCriteria: story.acceptanceCriteria || "",
    priority: story.priority || "Medium",
    storyPoints:
      story.storyPoints !== null && story.storyPoints !== undefined
        ? String(story.storyPoints)
        : "",
    assignee: story.assignee || "",
    status: story.status || "To Do",
    sprint: story.sprint || "",
    epic: story.epic || "",
    tags: Array.isArray(story.tags) ? story.tags.join(", ") : "",
    value:
      story.value !== null && story.value !== undefined
        ? String(story.value)
        : "",
    effort:
      story.effort !== null && story.effort !== undefined
        ? String(story.effort)
        : "",
  });

  useEffect(() => {
    const loadStoryForEdit = async () => {
      if (!storyIdParam) {
        setIsEditMode(false);
        setCurrentStoryId(null);
        setOriginalFormData(null);
        setLoadError(null);
        setFormData({ ...INITIAL_FORM_STATE });
        return;
      }

      try {
        setIsLoadingStory(true);
        setLoadError(null);
        const existingStory = await userStoriesService.getStoryById(
          storyIdParam
        );
        if (!existingStory) {
          throw new Error("Story not found");
        }
        const mapped = mapStoryToFormData(existingStory);
        setFormData(mapped);
        setOriginalFormData({ ...mapped });
        setCurrentStoryId(existingStory.id);
        setIsEditMode(true);
      } catch (error) {
        console.error("Failed to load story for editing:", error);
        setLoadError(
          error?.message ||
            "Unable to load the story for editing. Please try again."
        );
      } finally {
        setIsLoadingStory(false);
      }
    };

    loadStoryForEdit();
  }, [storyIdParam]);

  useEffect(() => {
    const loadSprints = async () => {
      try {
        setLoadingSprints(true);
        const sprintsData = await sprintService.getAllSprints();
        setSprints(Array.isArray(sprintsData) ? sprintsData : []);
      } catch (err) {
        console.error("Failed to load sprints:", err);
        setSprints([]);
      } finally {
        setLoadingSprints(false);
      }
    };

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersData = await authService.getUsersForAssignment();
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error("Failed to load users:", err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadSprints();
    loadUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.acceptanceCriteria.trim()) {
      newErrors.acceptanceCriteria = "Acceptance criteria is required";
    }
    if (
      formData.storyPoints &&
      (isNaN(formData.storyPoints) || Number(formData.storyPoints) < 0)
    ) {
      newErrors.storyPoints = "Story points must be a positive number";
    }
    if (
      formData.value &&
      (isNaN(formData.value) ||
        Number(formData.value) < 0 ||
        Number(formData.value) > 10)
    ) {
      newErrors.value = "Value must be between 0 and 10";
    }
    if (
      formData.effort &&
      (isNaN(formData.effort) ||
        Number(formData.effort) < 0 ||
        Number(formData.effort) > 10)
    ) {
      newErrors.effort = "Effort must be between 0 and 10";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const tagsArray = formData.tags
      ? formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    const storyData = {
      title: formData.title,
      description: formData.description,
      acceptanceCriteria: formData.acceptanceCriteria,
      priority: formData.priority,
      storyPoints: formData.storyPoints
        ? parseInt(formData.storyPoints, 10)
        : null,
      assignee: formData.assignee || null,
      status: formData.status,
      sprint: formData.sprint || null,
      epic: formData.epic || null,
      tags: tagsArray,
      value: formData.value ? parseInt(formData.value, 10) : null,
      effort: formData.effort ? parseInt(formData.effort, 10) : null,
    };

    try {
      if (currentStoryId) {
        const updatedStory = await userStoriesService.updateStory(
          currentStoryId,
          storyData
        );
        if (updatedStory?.id) {
          navigate(`/story/${updatedStory.id}`);
        } else {
          navigate(`/story/${currentStoryId}`);
        }
        return;
      }

      const createdStory = await userStoriesService.createStory(storyData);
      if (createdStory?.id) {
        // Automatically create a task for the new story
        try {
          const task = await taskService.createTaskForStory(createdStory);
          console.log("Task created for story:", task);
        } catch (taskError) {
          console.error("Error creating task for story:", taskError);
          // Don't block story creation if task creation fails
        }

        navigate(`/story/${createdStory.id}`);
        return;
      }

      navigate("/stories");
    } catch (error) {
      console.error("Error saving story:", error);
      const errorMessage =
        error.message ||
        "Failed to connect to the server. Please ensure the backend is running and try again.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(
      isEditMode && originalFormData
        ? { ...originalFormData }
        : { ...INITIAL_FORM_STATE }
    );
    setErrors({});
  };

  if (isLoadingStory) {
    return (
      <div className="story-creation-container">
        <div className="story-creation-form-wrapper">
          <div className="loading-state">Loading story...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="story-creation-container">
        <div className="story-creation-form-wrapper">
          <ErrorPlaceholder
            title="Failed to Load Story"
            message={loadError}
            icon="⚠️"
            actionLabel="Go Back"
            onAction={() =>
              currentStoryId
                ? navigate(`/story/${currentStoryId}`)
                : navigate("/stories")
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="story-creation-container">
      <div className="story-creation-form-wrapper">
        <h2 className="form-title">
          {isEditMode ? "Edit User Story" : "Create User Story"}
        </h2>
        <form onSubmit={handleSubmit} className="story-creation-form">
          {submitError && (
            <ErrorAlert
              message={submitError}
              onClose={() => setSubmitError(null)}
              type="error"
              dismissible={true}
            />
          )}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Story Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? "input-error" : ""}`}
              placeholder="As a [user], I want [feature] so that [benefit]"
            />
            {errors.title && <ValidationError message={errors.title} />}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-textarea ${
                errors.description ? "input-error" : ""
              }`}
              placeholder="Provide a detailed description of the user story..."
              rows="4"
            />
            {errors.description && (
              <ValidationError message={errors.description} />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="acceptanceCriteria" className="form-label">
              Acceptance Criteria <span className="required">*</span>
            </label>
            <textarea
              id="acceptanceCriteria"
              name="acceptanceCriteria"
              value={formData.acceptanceCriteria}
              onChange={handleChange}
              className={`form-textarea ${
                errors.acceptanceCriteria ? "input-error" : ""
              }`}
              placeholder="List the conditions that must be met for this story to be considered complete..."
              rows="4"
            />
            {errors.acceptanceCriteria && (
              <ValidationError message={errors.acceptanceCriteria} />
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="storyPoints" className="form-label">
                Story Points
              </label>
              <input
                type="number"
                id="storyPoints"
                name="storyPoints"
                value={formData.storyPoints}
                onChange={handleChange}
                className={`form-input ${
                  errors.storyPoints ? "input-error" : ""
                }`}
                placeholder="e.g., 3, 5, 8"
                min="0"
              />
              {errors.storyPoints && (
                <ValidationError message={errors.storyPoints} />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="value" className="form-label">
                Business Value (0-10)
              </label>
              <input
                type="number"
                id="value"
                name="value"
                value={formData.value}
                onChange={handleChange}
                className={`form-input ${errors.value ? "input-error" : ""}`}
                placeholder="0-10"
                min="0"
                max="10"
              />
              {errors.value && <ValidationError message={errors.value} />}
            </div>

            <div className="form-group">
              <label htmlFor="effort" className="form-label">
                Effort (0-10)
              </label>
              <input
                type="number"
                id="effort"
                name="effort"
                value={formData.effort}
                onChange={handleChange}
                className={`form-input ${errors.effort ? "input-error" : ""}`}
                placeholder="0-10"
                min="0"
                max="10"
              />
              {errors.effort && <ValidationError message={errors.effort} />}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="assignee" className="form-label">
                Assignee
              </label>
              <select
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="form-input"
                disabled={loadingUsers}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.fullName || user.email}>
                    {user.fullName || user.email}
                  </option>
                ))}
              </select>
              {loadingUsers && (
                <small className="form-hint">Loading users...</small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sprint" className="form-label">
                Sprint
              </label>
              <select
                id="sprint"
                name="sprint"
                value={formData.sprint}
                onChange={handleChange}
                className="form-input"
                disabled={loadingSprints}
              >
                <option value="">Unassigned</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.name}>
                    {sprint.name}
                  </option>
                ))}
              </select>
              {loadingSprints && (
                <small className="form-hint">Loading sprints...</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="epic" className="form-label">
                Epic
              </label>
              <input
                type="text"
                id="epic"
                name="epic"
                value={formData.epic}
                onChange={handleChange}
                className="form-input"
                placeholder="Epic name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              placeholder="Comma-separated tags (e.g., frontend, backend, api)"
            />
            <small className="form-hint">
              Separate multiple tags with commas
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                ? "Save Changes"
                : "Create Story"}
            </button>
            {isEditMode && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSubmitting}
                onClick={() => navigate(`/story/${currentStoryId}`)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoryCreationForm;
