/**
 * Retrospective Service
 * Handles retrospective data management and API calls
 */

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");
const RETROSPECTIVES_ENDPOINT = `${API_BASE_URL}/api/retrospectives`;

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

class RetrospectiveService {
  /**
   * Get all retrospectives from backend API
   */
  async getAllRetrospectives() {
    try {
      const response = await fetch(RETROSPECTIVES_ENDPOINT, {
        method: "GET",
        headers: defaultHeaders(),
      });

      const result = await handleResponse(response);
      // Backend returns direct array
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Error fetching retrospectives:", error);
      return [];
    }
  }

  /**
   * Get a single retrospective by ID
   */
  async getRetrospectiveById(id) {
    try {
      const response = await fetch(`${RETROSPECTIVES_ENDPOINT}/${id}`, {
        method: "GET",
        headers: defaultHeaders(),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching retrospective:", error);
      throw error;
    }
  }

  /**
   * Create a new retrospective
   */
  async createRetrospective(retrospectiveData) {
    try {
      const response = await fetch(RETROSPECTIVES_ENDPOINT, {
        method: "POST",
        headers: defaultHeaders(),
        body: JSON.stringify({
          sprintId: retrospectiveData.sprintId || null,
          sprintName: retrospectiveData.sprintName || null,
          wentWell: retrospectiveData.wentWell || "",
          toImprove: retrospectiveData.toImprove || "",
          actionItems: retrospectiveData.actionItems || "",
        }),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Error creating retrospective:", error);
      throw error;
    }
  }

  /**
   * Update an existing retrospective
   */
  async updateRetrospective(id, retrospectiveData) {
    try {
      const response = await fetch(`${RETROSPECTIVES_ENDPOINT}/${id}`, {
        method: "PATCH",
        headers: defaultHeaders(),
        body: JSON.stringify({
          sprintId: retrospectiveData.sprintId !== undefined ? retrospectiveData.sprintId : null,
          sprintName: retrospectiveData.sprintName !== undefined ? retrospectiveData.sprintName : null,
          wentWell: retrospectiveData.wentWell !== undefined ? retrospectiveData.wentWell : undefined,
          toImprove: retrospectiveData.toImprove !== undefined ? retrospectiveData.toImprove : undefined,
          actionItems: retrospectiveData.actionItems !== undefined ? retrospectiveData.actionItems : undefined,
        }),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Error updating retrospective:", error);
      throw error;
    }
  }

  /**
   * Delete a retrospective
   */
  async deleteRetrospective(id) {
    try {
      const response = await fetch(`${RETROSPECTIVES_ENDPOINT}/${id}`, {
        method: "DELETE",
        headers: defaultHeaders(),
      });

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

      // Backend returns { message: 'Retrospective deleted successfully' } with 200 status
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error deleting retrospective:", error);
      throw error;
    }
  }
}

const retrospectiveService = new RetrospectiveService();
export default retrospectiveService;

