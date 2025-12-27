import React, { useEffect } from "react";
import "./Notification.css";

const Notification = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (notification.autoDismiss !== false) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  const handleDismiss = () => {
    onDismiss(notification.id);
  };

  return (
    <div
      className={`notification notification-${notification.type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="notification-content">
        <span className="notification-icon">
          {notification.type === "success" ? "✓" : "✕"}
        </span>
        <span className="notification-message">{notification.message}</span>
      </div>
      <button
        className="notification-close"
        onClick={handleDismiss}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Notification;

