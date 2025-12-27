/**
 * Sprint Service
 * Handles sprint data management and operations
 */

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

const SPRINTS_ENDPOINT = `${API_BASE_URL}/api/sprints`;
const STORAGE_KEY = "agilepulse_sprints";

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
  // Backend wraps responses in ApiResponseDto format: { success, message, data }
  // Extract the data field if it exists, otherwise return the payload as-is
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  return data;
};

class SprintService {
  /**
   * Get all sprints from backend API
   */
  async getAllSprints() {
    try {
      const response = await fetch(SPRINTS_ENDPOINT, {
        method: "GET",
        headers: defaultHeaders(),
      });

      const sprints = await handleResponse(response);

      if (Array.isArray(sprints)) {
        // Transform to match frontend expectations
        return sprints
          .map((sprint) => {
            // Safely handle dates - ensure they're strings, not Date objects
            const normalizeDate = (date) => {
              if (!date) return null;
              if (date instanceof Date) return date.toISOString();
              if (typeof date === 'string') return date;
              return null;
            };

            return {
              id: sprint.id,
              name: sprint.name,
              stories: [], // Will be loaded separately if needed
              story_count: sprint.story_count || 0,
              total_points: sprint.total_points || 0,
              created_at: normalizeDate(sprint.created_at),
              description: sprint.description,
              start_date: normalizeDate(sprint.start_date),
              end_date: normalizeDate(sprint.end_date),
              goal: sprint.goal,
            };
          })
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
      }

      return [];
    } catch (error) {
      console.error("Error fetching sprints:", error);
      // Fallback to local storage
      const cached = this.getSprintsFromStorage();
      return cached;
    }
  }

  /**
   * Get stories for a specific sprint
   */
  async getSprintStories(sprintName) {
    try {
      const encodedName = encodeURIComponent(sprintName);
      const response = await fetch(
        `${SPRINTS_ENDPOINT}/name/${encodedName}/stories`,
        {
          method: "GET",
          headers: defaultHeaders(),
        }
      );

      const stories = await handleResponse(response);
      return Array.isArray(stories) ? stories : [];
    } catch (error) {
      console.error("Error fetching sprint stories:", error);
      return [];
    }
  }

  /**
   * Get unassigned stories (stories without a sprint)
   */
  async getUnassignedStories() {
    try {
      const response = await fetch(`${SPRINTS_ENDPOINT}/unassigned/stories`, {
        method: "GET",
        headers: defaultHeaders(),
      });

      const stories = await handleResponse(response);
      return Array.isArray(stories) ? stories : [];
    } catch (error) {
      console.error("Error fetching unassigned stories:", error);
      return [];
    }
  }

  /**
   * Assign story to sprint
   */
  async assignStoryToSprint(storyId, sprintName) {
    try {
      if (!sprintName || !sprintName.trim()) {
        // If no sprint name, unassign instead
        return this.unassignStoryFromSprint(storyId);
      }

      const encodedName = encodeURIComponent(sprintName.trim());
      const response = await fetch(
        `${SPRINTS_ENDPOINT}/name/${encodedName}/assign/${storyId}`,
        {
          method: "POST",
          headers: defaultHeaders(),
        }
      );

      return await handleResponse(response);
    } catch (error) {
      console.error("Error assigning story to sprint:", error);
      throw error;
    }
  }

  /**
   * Remove story from sprint (unassign)
   */
  async unassignStoryFromSprint(storyId) {
    try {
      const response = await fetch(`${SPRINTS_ENDPOINT}/unassign/${storyId}`, {
        method: "POST",
        headers: defaultHeaders(),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Error unassigning story from sprint:", error);
      throw error;
    }
  }

  /**
   * Move story between sprints
   */
  async moveStoryToSprint(storyId, fromSprint, toSprint) {
    return this.assignStoryToSprint(storyId, toSprint);
  }

  /**
   * Get sprint statistics
   */
  async getSprintStats(sprintName) {
    try {
      const encodedName = encodeURIComponent(sprintName);
      const response = await fetch(
        `${SPRINTS_ENDPOINT}/name/${encodedName}/stats`,
        {
          method: "GET",
          headers: defaultHeaders(),
        }
      );

      return await handleResponse(response);
    } catch (error) {
      console.error("Error getting sprint stats:", error);
      return null;
    }
  }

  /**
   * Create a new sprint
   */
  async createSprint(sprintData) {
    try {
      const response = await fetch(SPRINTS_ENDPOINT, {
        method: "POST",
        headers: defaultHeaders(),
        body: JSON.stringify(sprintData),
      });

      const result = await handleResponse(response);
      // Handle new response format with message
      if (result && result.sprint) {
        return { ...result.sprint, message: result.message };
      }
      return result;
    } catch (error) {
      console.error("Error creating sprint:", error);
      throw error;
    }
  }

  /**
   * Update a sprint
   */
  async updateSprint(sprintId, sprintData) {
    try {
      const response = await fetch(`${SPRINTS_ENDPOINT}/${sprintId}`, {
        method: "PATCH",
        headers: defaultHeaders(),
        body: JSON.stringify(sprintData),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Error updating sprint:", error);
      throw error;
    }
  }

  /**
   * Delete a sprint
   */
  async deleteSprint(sprintId) {
    try {
      const response = await fetch(`${SPRINTS_ENDPOINT}/${sprintId}`, {
        method: "DELETE",
        headers: defaultHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `Failed to delete sprint: ${response.status}`
        );
      }

      const result = await response.json();
      return result || { message: 'Sprint deleted successfully' };
    } catch (error) {
      console.error("Error deleting sprint:", error);
      throw error;
    }
  }

  // Local storage helpers (for fallback/offline support)
  getSprintsFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading sprints from storage:", error);
      return [];
    }
  }

  saveSprintsToStorage(sprints) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sprints));
    } catch (error) {
      console.error("Error saving sprints to storage:", error);
    }
  }
}

const sprintService = new SprintService();
export default sprintService;
