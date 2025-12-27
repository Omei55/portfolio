/**
 * Sprints Service
 * Handles sprint data management and task assignment
 */

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");
const SPRINTS_ENDPOINT = `${API_BASE_URL}/api/sprints`;

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

class SprintsService {
  /**
   * Get all sprints
   * @returns {Promise<Array>} Array of sprints
   */
  async getAllSprints() {
    try {
      const sprints = await this.requestJson(SPRINTS_ENDPOINT, {
        method: "GET",
      });
      return Array.isArray(sprints) ? sprints : [];
    } catch (error) {
      console.error("Error fetching sprints:", error);
      throw error;
    }
  }

  /**
   * Get unassigned stories (backlog tasks)
   * @returns {Promise<Array>} Array of unassigned stories
   */
  async getUnassignedStories() {
    try {
      const stories = await this.requestJson(
        `${SPRINTS_ENDPOINT}/unassigned/stories`,
        {
          method: "GET",
        }
      );
      return Array.isArray(stories) ? stories : [];
    } catch (error) {
      console.error("Error fetching unassigned stories:", error);
      throw error;
    }
  }

  /**
   * Assign a story to a sprint by sprint name
   * @param {string} storyId - Story ID
   * @param {string} sprintName - Sprint name
   * @returns {Promise<Object>} Updated story
   */
  async assignStoryToSprint(storyId, sprintName) {
    try {
      const story = await this.requestJson(
        `${SPRINTS_ENDPOINT}/name/${encodeURIComponent(sprintName)}/assign/${storyId}`,
        {
          method: "POST",
        }
      );
      return story;
    } catch (error) {
      console.error("Error assigning story to sprint:", error);
      throw error;
    }
  }

  /**
   * Assign multiple stories to a sprint
   * @param {Array<string>} storyIds - Array of story IDs
   * @param {string} sprintName - Sprint name
   * @returns {Promise<Array>} Array of updated stories
   */
  async assignStoriesToSprint(storyIds, sprintName) {
    try {
      const promises = storyIds.map((storyId) =>
        this.assignStoryToSprint(storyId, sprintName)
      );
      const results = await Promise.allSettled(promises);
      
      const successful = [];
      const failed = [];
      
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successful.push(result.value);
        } else {
          failed.push({
            storyId: storyIds[index],
            error: result.reason?.message || "Unknown error",
          });
        }
      });

      return { successful, failed };
    } catch (error) {
      console.error("Error assigning stories to sprint:", error);
      throw error;
    }
  }

  /**
   * Unassign a story from sprint
   * @param {string} storyId - Story ID
   * @returns {Promise<boolean>} Success status
   */
  async unassignStoryFromSprint(storyId) {
    try {
      await this.requestJson(`${SPRINTS_ENDPOINT}/unassign/${storyId}`, {
        method: "POST",
      });
      return true;
    } catch (error) {
      console.error("Error unassigning story from sprint:", error);
      throw error;
    }
  }

  /**
   * Get stories for a specific sprint
   * @param {string} sprintName - Sprint name
   * @returns {Promise<Array>} Array of stories in the sprint
   */
  async getSprintStories(sprintName) {
    try {
      const stories = await this.requestJson(
        `${SPRINTS_ENDPOINT}/name/${encodeURIComponent(sprintName)}/stories`,
        {
          method: "GET",
        }
      );
      return Array.isArray(stories) ? stories : [];
    } catch (error) {
      console.error("Error fetching sprint stories:", error);
      throw error;
    }
  }

  /**
   * Check if a sprint is active or upcoming
   * @param {Object} sprint - Sprint object
   * @returns {boolean} True if sprint is active or upcoming
   */
  isSprintActiveOrUpcoming(sprint) {
    if (!sprint.start_date && !sprint.end_date) {
      // If no dates, consider it active/upcoming
      return true;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (sprint.end_date) {
      const endDate = new Date(sprint.end_date);
      endDate.setHours(0, 0, 0, 0);
      // Sprint is active/upcoming if end date is today or in the future
      return endDate >= now;
    }

    if (sprint.start_date) {
      const startDate = new Date(sprint.start_date);
      startDate.setHours(0, 0, 0, 0);
      // Sprint is upcoming if start date is today or in the future
      return startDate >= now;
    }

    return true;
  }

  async requestJson(url, options) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders(),
        ...(options?.headers || {}),
      },
    });

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (isJson ? payload?.message : payload) ||
        response.statusText ||
        "Request failed";
      throw new Error(errorMessage);
    }

    return payload;
  }
}

const sprintsService = new SprintsService();
export default sprintsService;

