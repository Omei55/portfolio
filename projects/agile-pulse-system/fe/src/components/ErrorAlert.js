/**
 * ErrorAlert Component
 * Displays consistent error messages for API failures and general errors
 */

import React from "react";
import "./ErrorAlert.css";

const ErrorAlert = ({
  message,
  onClose,
  type = "error", // 'error', 'warning', 'info'
  dismissible = true,
  className = "",
}) => {
  if (!message) {
    return null;
  }

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`error-alert error-alert-${type} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="error-alert-content">
        <span className="error-alert-icon">
          {type === "error" && "⚠️"}
          {type === "warning" && "⚠️"}
          {type === "info" && "ℹ️"}
        </span>
        <span className="error-alert-message">{message}</span>
      </div>
      {dismissible && onClose && (
        <button
          className="error-alert-close"
          onClick={handleClose}
          aria-label="Close error message"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
