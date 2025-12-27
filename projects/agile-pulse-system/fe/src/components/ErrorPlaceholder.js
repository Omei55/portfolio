/**
 * ErrorPlaceholder Component
 * Displays a consistent placeholder for API failures and empty states
 */

import React from "react";
import "./ErrorAlert.css";

const ErrorPlaceholder = ({
  title = "Something went wrong",
  message = "We encountered an error while loading this content. Please try again.",
  icon = "⚠️",
  actionLabel = "Retry",
  onAction,
  className = "",
}) => {
  return (
    <div className={`error-placeholder ${className}`}>
      <div className="error-placeholder-icon">{icon}</div>
      <div className="error-placeholder-title">{title}</div>
      <div className="error-placeholder-message">{message}</div>
      {onAction && actionLabel && (
        <div className="error-placeholder-action">
          <button
            className="error-placeholder-button"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorPlaceholder;
