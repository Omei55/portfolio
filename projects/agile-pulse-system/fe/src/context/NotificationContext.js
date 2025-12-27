import React, { createContext, useContext, useState, useCallback } from "react";
import NotificationContainer from "../components/NotificationContainer";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = "success", options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration: options.duration || 4000,
      autoDismiss: options.autoDismiss !== false,
    };

    setNotifications((prev) => [...prev, notification]);

    return id;
  }, []);

  const showSuccess = useCallback(
    (message, options) => {
      return showNotification(message, "success", options);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message, options) => {
      return showNotification(message, "error", options);
    },
    [showNotification]
  );

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = {
    showNotification,
    showSuccess,
    showError,
    dismissNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  );
};

