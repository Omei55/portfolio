import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import retrospectiveService from "../services/retrospectiveService";
import sprintService from "../services/sprintService";
import "./RetrospectiveBoard.css";

const RetrospectiveBoard = () => {
  const navigate = useNavigate();
  const [retrospectives, setRetrospectives] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    sprintId: "",
    sprintName: "",
    wentWell: "",
    toImprove: "",
    actionItems: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [retrospectivesData, sprintsData] = await Promise.all([
        retrospectiveService.getAllRetrospectives(),
        sprintService.getAllSprints(),
      ]);
      setRetrospectives(Array.isArray(retrospectivesData) ? retrospectivesData : []);
      setSprints(Array.isArray(sprintsData) ? sprintsData : []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSprintChange = (e) => {
    const selectedSprintId = e.target.value;
    const selectedSprint = sprints.find((s) => s.id === selectedSprintId);
    setFormData((prev) => ({
      ...prev,
      sprintId: selectedSprintId || "",
      sprintName: selectedSprint ? selectedSprint.name : "",
    }));
  };

  const resetForm = () => {
    setFormData({
      sprintId: "",
      sprintName: "",
      wentWell: "",
      toImprove: "",
      actionItems: "",
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleEdit = (retrospective) => {
    setFormData({
      sprintId: retrospective.sprintId || "",
      sprintName: retrospective.sprintName || "",
      wentWell: retrospective.wentWell || "",
      toImprove: retrospective.toImprove || "",
      actionItems: retrospective.actionItems || "",
    });
    setEditingId(retrospective.id);
    setIsCreating(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMessage(null);

      if (editingId) {
        await retrospectiveService.updateRetrospective(editingId, formData);
        setSuccessMessage("Retrospective updated successfully!");
      } else {
        await retrospectiveService.createRetrospective(formData);
        setSuccessMessage("Retrospective created successfully!");
      }

      resetForm();
      await loadData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving retrospective:", err);
      setError(err.message || "Failed to save retrospective");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this retrospective?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await retrospectiveService.deleteRetrospective(id);
      setSuccessMessage("Retrospective deleted successfully!");
      await loadData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting retrospective:", err);
      setError(err.message || "Failed to delete retrospective");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="retrospective-board">
        <div className="retrospective-loading">Loading retrospectives...</div>
      </div>
    );
  }

  return (
    <div className="retrospective-board">
      <div className="retrospective-header">
        <h1 className="retrospective-title">Sprint Retrospective Board</h1>
        <button className="create-retrospective-btn" onClick={handleCreate}>
          + New Retrospective
        </button>
      </div>

      {error && (
        <div className="retrospective-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="retrospective-success">
          <p>{successMessage}</p>
          <button onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="retrospective-form-container">
          <form className="retrospective-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>{editingId ? "Edit Retrospective" : "Create New Retrospective"}</h2>
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="sprintId">Sprint (Optional)</label>
              <select
                id="sprintId"
                name="sprintId"
                value={formData.sprintId}
                onChange={handleSprintChange}
                className="form-select"
              >
                <option value="">Select a sprint...</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="wentWell">Went Well *</label>
              <textarea
                id="wentWell"
                name="wentWell"
                value={formData.wentWell}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="What went well in this sprint?"
                required
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="toImprove">To Improve *</label>
              <textarea
                id="toImprove"
                name="toImprove"
                value={formData.toImprove}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="What can we improve?"
                required
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="actionItems">Action Items *</label>
              <textarea
                id="actionItems"
                name="actionItems"
                value={formData.actionItems}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="What action items should we take?"
                required
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingId ? "Update" : "Create"} Retrospective
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Retrospectives List */}
      <div className="retrospectives-list">
        {retrospectives.length === 0 ? (
          <div className="empty-retrospectives">
            <p>No retrospectives yet. Create one to get started!</p>
          </div>
        ) : (
          retrospectives.map((retrospective) => (
            <div key={retrospective.id} className="retrospective-card">
              <div className="retrospective-card-header">
                <div className="retrospective-meta">
                  <h3 className="retrospective-sprint">
                    {retrospective.sprintName || "General Retrospective"}
                  </h3>
                  <span className="retrospective-date">
                    {formatDate(retrospective.createdAt)}
                  </span>
                </div>
                <div className="retrospective-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(retrospective)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(retrospective.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="retrospective-content">
                <div className="retrospective-section">
                  <h4 className="section-title went-well">Went Well</h4>
                  <p className="section-content">{retrospective.wentWell}</p>
                </div>

                <div className="retrospective-section">
                  <h4 className="section-title to-improve">To Improve</h4>
                  <p className="section-content">{retrospective.toImprove}</p>
                </div>

                <div className="retrospective-section">
                  <h4 className="section-title action-items">Action Items</h4>
                  <p className="section-content">{retrospective.actionItems}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RetrospectiveBoard;

