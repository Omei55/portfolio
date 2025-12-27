import React, { useState, useEffect } from "react";
import notificationService from "../services/notificationService";
import "./NotificationPreferences.css";

const NotificationPreferences = ({ onClose }) => {
  const [preferences, setPreferences] = useState({
    storySprintReady: true,
    storyExported: true,
    mvpFinalized: true,
    storyStatusChanged: true,
    emailNotifications: false,
    pushNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getUserPreferences();
      if (data) {
        setPreferences(data);
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
      setError(err.message || "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      await notificationService.updateUserPreferences(preferences);
      setSuccessMessage("Preferences saved successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="notification-preferences-modal">
        <div className="modal-content">
          <div className="loading-state">Loading preferences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-preferences-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Notification Preferences</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}

        <div className="preferences-content">
          <div className="preferences-section">
            <h3 className="section-title">Event Notifications</h3>
            <p className="section-description">
              Choose which events you want to be notified about
            </p>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">
                  Story becomes Sprint-Ready
                </label>
                <p className="preference-description">
                  Get notified when a story becomes ready for sprint assignment
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.storySprintReady}
                  onChange={() => handleChange("storySprintReady")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">Story Exported</label>
                <p className="preference-description">
                  Get notified when a story is exported to external systems
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.storyExported}
                  onChange={() => handleChange("storyExported")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">MVP Finalized</label>
                <p className="preference-description">
                  Get notified when the MVP is finalized
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.mvpFinalized}
                  onChange={() => handleChange("mvpFinalized")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">Story Status Changed</label>
                <p className="preference-description">
                  Get notified when story status changes
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.storyStatusChanged}
                  onChange={() => handleChange("storyStatusChanged")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="preferences-section">
            <h3 className="section-title">Delivery Methods</h3>
            <p className="section-description">
              Choose how you want to receive notifications
            </p>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">In-App Notifications</label>
                <p className="preference-description">
                  Show notifications in the application
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={() => handleChange("pushNotifications")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">Email Notifications</label>
                <p className="preference-description">
                  Receive notifications via email (requires email setup)
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => handleChange("emailNotifications")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;

