/**
 * Analytics Service
 * Handles analytics data from backend API
 */

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

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
  const data = await response.json();
  // Handle standardized API response format if present
  if (data && data.success && data.data) {
    return data.data;
  }
  // Return direct response
  return data;
};

class AnalyticsService {
  /**
   * Get overall analytics from backend API
   */
  async getOverallAnalytics() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/overall`, {
        method: "GET",
        headers: defaultHeaders(),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching overall analytics:", error);
      throw error;
    }
  }

  /**
   * Get sprint analytics from backend API
   */
  async getSprintAnalytics(sprintName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/sprint/${encodeURIComponent(sprintName)}`, {
        method: "GET",
        headers: defaultHeaders(),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching sprint analytics:", error);
      throw error;
    }
  }

  /**
   * Get story analytics from backend API
   */
  async getStoryAnalytics() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/stories`, {
        method: "GET",
        headers: defaultHeaders(),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching story analytics:", error);
      throw error;
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;

