/**
 * Notification Service
 * Handles notification data management and API calls
 */

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");
const NOTIFICATIONS_ENDPOINT = `${API_BASE_URL}/api/notifications`;

const defaultHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getUserNotifications() {
    try {
      const response = await fetch(NOTIFICATIONS_ENDPOINT, {
        method: "GET",
        headers: defaultHeaders(),
      });

      const result = await handleResponse(response);
      // Handle standardized API response format if present
      if (result && result.success && result.data) {
        return result.data;
      }
      // Return direct response (array)
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications() {
    try {
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/unread`, {
        method: "GET",
        headers: defaultHeaders(),
      });

      const result = await handleResponse(response);
      // Handle standardized API response format if present
      if (result && result.success && result.data) {
        return result.data;
      }
      // Return direct response (array)
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await fetch(
        `${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`,
        {
          method: "PATCH",
          headers: defaultHeaders(),
        }
      );

      await handleResponse(response);
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/mark-all-read`, {
        method: "POST",
        headers: defaultHeaders(),
      });

      await handleResponse(response);
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}`, {
        method: "DELETE",
        headers: defaultHeaders(),
      });

      await handleResponse(response);
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences() {
    try {
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/preferences`, {
        method: "GET",
        headers: defaultHeaders(),
      });

      const result = await handleResponse(response);
      // Handle standardized API response format if present
      if (result && result.success && result.data) {
        return result.data;
      }
      // Return direct response
      return result;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(preferences) {
    try {
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/preferences`, {
        method: "PATCH",
        headers: defaultHeaders(),
        body: JSON.stringify(preferences),
      });

      const result = await handleResponse(response);
      // Handle standardized API response format if present
      if (result && result.success && result.data) {
        return result.data;
      }
      // Return direct response
      return result;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;

