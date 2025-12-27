import React, { useState, useEffect, useCallback } from "react";
import notificationService from "../services/notificationService";
import "./InAppNotifications.css";

const InAppNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [allNotifications, unreadNotifications] = await Promise.all([
        notificationService.getUserNotifications(),
        notificationService.getUnreadNotifications(),
      ]);
      setNotifications(Array.isArray(allNotifications) ? allNotifications : []);
      setUnreadCount(Array.isArray(unreadNotifications) ? unreadNotifications.length : 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "story_sprint_ready":
        return "🚀";
      case "story_exported":
        return "📤";
      case "mvp_finalized":
        return "✅";
      case "story_status_changed":
        return "🔄";
      default:
        return "🔔";
    }
  };

  return (
    <div className="in-app-notifications">
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="notification-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="notification-panel">
            <div className="notification-header">
              <h3 className="notification-title">Notifications</h3>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button
                    className="mark-all-read-btn"
                    onClick={handleMarkAllAsRead}
                    title="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  className="close-panel-btn"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-loading">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      !notification.read ? "unread" : ""
                    }`}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title-text">
                        {notification.title}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                    <div className="notification-actions-item">
                      {!notification.read && (
                        <button
                          className="mark-read-btn"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        className="delete-notification-btn"
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InAppNotifications;

