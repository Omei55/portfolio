import React from "react";
import Notification from "./Notification";
import "./Notification.css";

const NotificationContainer = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;

