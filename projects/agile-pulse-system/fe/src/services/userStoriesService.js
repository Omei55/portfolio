/**
 * User Stories Service
 * Handles user stories data management and persistence
 */

const STORAGE_KEY = "agilepulse_user_stories";
const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");
const STORIES_ENDPOINT = `${API_BASE_URL}/api/stories`;

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

class UserStoriesService {
  async getAllStories({ useCacheFallback = true, filters = {} } = {}) {
    try {
      const url = new URL(STORIES_ENDPOINT);
      
      // Add filter parameters to URL in backend-compatible format
      // Backend expects: statuses (array), priorities (array), assignees (array)
      // The backend DTO transforms comma-separated strings to arrays
      
      // Status filter - send as statuses (comma-separated) for multiple values
      if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
        if (filters.status.length === 1) {
          url.searchParams.set("status", filters.status[0]);
        } else {
          url.searchParams.set("statuses", filters.status.join(","));
        }
      } else if (filters.status && typeof filters.status === "string") {
        url.searchParams.set("status", filters.status);
      }
      
      // Priority filter - send as priorities (comma-separated) for multiple values
      if (filters.priority && Array.isArray(filters.priority) && filters.priority.length > 0) {
        if (filters.priority.length === 1) {
          url.searchParams.set("priority", filters.priority[0]);
        } else {
          url.searchParams.set("priorities", filters.priority.join(","));
        }
      } else if (filters.priority && typeof filters.priority === "string") {
        url.searchParams.set("priority", filters.priority);
      }
      
      // Assignee filter - send as assignees (comma-separated) for multiple values
      if (filters.assignee && Array.isArray(filters.assignee) && filters.assignee.length > 0) {
        if (filters.assignee.length === 1) {
          url.searchParams.set("assignee", filters.assignee[0]);
        } else {
          url.searchParams.set("assignees", filters.assignee.join(","));
        }
      } else if (filters.assignee && typeof filters.assignee === "string") {
        url.searchParams.set("assignee", filters.assignee);
      }
      
      // Story points range filters
      if (filters.storyPointsMin !== undefined && filters.storyPointsMin !== null) {
        url.searchParams.set("storyPointsMin", filters.storyPointsMin);
      }
      
      if (filters.storyPointsMax !== undefined && filters.storyPointsMax !== null) {
        url.searchParams.set("storyPointsMax", filters.storyPointsMax);
      }

      // Additional backend-supported filters
      if (filters.search && filters.search.trim()) {
        url.searchParams.set("search", filters.search.trim());
      }
      
      if (filters.sortBy) {
        url.searchParams.set("sortBy", filters.sortBy);
      }
      
      if (filters.sortOrder) {
        url.searchParams.set("sortOrder", filters.sortOrder);
      }

      const stories = await this.requestJson(url.toString(), {
        method: "GET",
      });
      
      // Backend handles all filtering, so return results directly
      if (Array.isArray(stories)) {
        this.saveStories(stories);
        return stories;
      }
      
      // Handle paginated response (if backend returns paginated format)
      if (stories && stories.data && Array.isArray(stories.data)) {
        this.saveStories(stories.data);
        return stories.data;
      }
      
      return [];
    } catch (error) {
      console.warn("API fetch failed, using local storage fallback:", error);
      if (!useCacheFallback) {
        throw error;
      }

      const cachedStories = this.getStoriesFromStorage();
      
      // Apply client-side filtering only as fallback when API is unavailable
      let filteredStories = cachedStories;
      if (Object.keys(filters).length > 0) {
        filteredStories = this.applyClientSideFilters(cachedStories, filters);
      }
      
      if (filteredStories.length === 0 && cachedStories.length === 0) {
        const sampleStories = this.getSampleStories();
        this.saveStories(sampleStories);
        return this.applyClientSideFilters(sampleStories, filters);
      }
      return filteredStories;
    }
  }

  /**
   * Apply client-side filtering to stories
   * @param {Array} stories - Array of stories to filter
   * @param {Object} filters - Filter object with status, priority, assignee, storyPointsMin, storyPointsMax
   * @returns {Array} Filtered stories
   */
  applyClientSideFilters(stories, filters) {
    let filtered = [...stories];

    // Filter by status (multi-select)
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      filtered = filtered.filter((story) => 
        filters.status.includes(story.status)
      );
    }

    // Filter by priority (multi-select)
    if (filters.priority && Array.isArray(filters.priority) && filters.priority.length > 0) {
      filtered = filtered.filter((story) => 
        filters.priority.includes(story.priority)
      );
    }

    // Filter by assignee (multi-select)
    if (filters.assignee && Array.isArray(filters.assignee) && filters.assignee.length > 0) {
      filtered = filtered.filter((story) => 
        story.assignee && filters.assignee.includes(story.assignee)
      );
    }

    // Filter by story points range
    if (filters.storyPointsMin !== undefined && filters.storyPointsMin !== null) {
      filtered = filtered.filter((story) => 
        story.storyPoints !== null && 
        story.storyPoints !== undefined && 
        story.storyPoints >= filters.storyPointsMin
      );
    }

    if (filters.storyPointsMax !== undefined && filters.storyPointsMax !== null) {
      filtered = filtered.filter((story) => 
        story.storyPoints !== null && 
        story.storyPoints !== undefined && 
        story.storyPoints <= filters.storyPointsMax
      );
    }

    return filtered;
  }

  filterStories(stories, filters = {}) {
    let filtered = [...stories];
    
    if (filters.priority) {
      filtered = filtered.filter((story) => story.priority === filters.priority);
    }
    
    if (filters.status) {
      filtered = filtered.filter((story) => story.status === filters.status);
    }
    
    if (filters.storyPointsMin !== undefined && filters.storyPointsMin !== null && filters.storyPointsMin !== '') {
      const min = Number(filters.storyPointsMin);
      if (!isNaN(min)) {
        filtered = filtered.filter((story) => {
          const points = story.storyPoints || 0;
          return points >= min;
        });
      }
    }
    
    if (filters.storyPointsMax !== undefined && filters.storyPointsMax !== null && filters.storyPointsMax !== '') {
      const max = Number(filters.storyPointsMax);
      if (!isNaN(max)) {
        filtered = filtered.filter((story) => {
          const points = story.storyPoints || 0;
          return points <= max;
        });
      }
    }
    
    return filtered;
  }

  async searchStories(query) {
    try {
      const url = new URL(`${STORIES_ENDPOINT}/search`);
      if (query && query.trim()) {
        url.searchParams.set("q", query.trim());
      }
      const stories = await this.requestJson(url.toString(), {
        method: "GET",
      });

      if (Array.isArray(stories)) {
        this.saveStories(stories);
        return stories;
      }

      return [];
    } catch (error) {
      console.error("Error searching stories:", error);
      throw error;
    }
  }

  async getStoryById(id) {
    if (!id) {
      throw new Error("Story ID is required");
    }

    try {
      const story = await this.requestJson(`${STORIES_ENDPOINT}/${id}`, {
        method: "GET",
      });
      if (story) {
        this.updateStoryInStorage(story);
      }
      return story;
    } catch (error) {
      console.warn(
        `Failed to fetch story ${id} from API, using cache if available`,
        error
      );
      const cachedStories = this.getStoriesFromStorage();
      return cachedStories.find((story) => story.id === id) || null;
    }
  }

  async checkReadiness(storyId) {
    if (!storyId) {
      throw new Error("Story ID is required");
    }

    return this.requestJson(`${STORIES_ENDPOINT}/${storyId}/readiness`, {
      method: "GET",
    });
  }

  /**
   * Get stories from localStorage
   * @returns {Array} Array of user stories
   */
  getStoriesFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return [];
    }
  }

  /**
   * Save stories to localStorage
   * @param {Array} stories - Array of user stories
   */
  saveStories(stories) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  /**
   * Create or update a user story
   * @param {Object} story - User story object
   * @returns {Promise<Object>} Created/updated story
   */
  async saveStory(story) {
    if (story?.id) {
      return this.updateStory(story.id, story);
    }
    return this.createStory(story);
  }

  async createStory(story) {
    try {
      const payload = this.prepareStoryPayload(story);
      const createdStory = await this.requestJson(STORIES_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (createdStory) {
        this.updateStoryInStorage(createdStory);
      }

      return createdStory;
    } catch (error) {
      console.error("Error creating story:", error);
      throw error;
    }
  }

  async updateStory(id, story) {
    try {
      const payload = this.prepareStoryPayload(story, { partial: true });
      const updatedStory = await this.requestJson(`${STORIES_ENDPOINT}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (updatedStory) {
        this.updateStoryInStorage(updatedStory);
      }

      return updatedStory;
    } catch (error) {
      console.error("Error updating story:", error);
      throw error;
    }
  }

  /**
   * Update story in localStorage
   * @param {Object} story - Updated story
   */
  updateStoryInStorage(story) {
    const stories = this.getStoriesFromStorage();
    const index = stories.findIndex((s) => s.id === story.id);
    if (index !== -1) {
      stories[index] = story;
    } else {
      stories.push(story);
    }
    this.saveStories(stories);
  }

  /**
   * Delete a user story
   * @param {string} storyId - Story ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteStory(storyId) {
    try {
      const result = await this.requestJson(`${STORIES_ENDPOINT}/${storyId}`, {
        method: "DELETE",
      });
      this.removeStoryFromStorage(storyId);
      return result || { message: 'Story deleted successfully' };
    } catch (error) {
      console.error("Error deleting story:", error);
      // Even if API delete fails, attempt to remove locally as fallback
      this.removeStoryFromStorage(storyId);
      throw error;
    }
  }

  /**
   * Remove story from localStorage
   * @param {string} storyId - Story ID
   */
  removeStoryFromStorage(storyId) {
    const stories = this.getStoriesFromStorage();
    const filtered = stories.filter((s) => s.id !== storyId);
    this.saveStories(filtered);
  }

  /**
   * Get sample stories for initial data
   * @returns {Array} Array of sample user stories
   */
  getSampleStories() {
    return [
      {
        id: "1",
        title: "Implement user authentication",
        priority: "High",
        storyPoints: 8,
        status: "In Progress",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        title: "Design dashboard UI",
        priority: "Medium",
        storyPoints: 5,
        status: "To Do",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        title: "Set up database schema",
        priority: "High",
        storyPoints: 13,
        status: "Done",
        createdAt: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "4",
        title: "Create API endpoints for stories",
        priority: "High",
        storyPoints: 8,
        status: "In Progress",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "5",
        title: "Write unit tests",
        priority: "Medium",
        storyPoints: 5,
        status: "To Do",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "6",
        title: "Implement filtering and sorting",
        priority: "Medium",
        storyPoints: 3,
        status: "Done",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "7",
        title: "Add user profile management",
        priority: "Low",
        storyPoints: 5,
        status: "To Do",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "8",
        title: "Integrate with Jira",
        priority: "High",
        storyPoints: 13,
        status: "To Do",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  prepareStoryPayload(story, { partial = false } = {}) {
    if (!story) {
      return {};
    }

    const payload = {
      title: story.title,
      description: story.description,
      acceptanceCriteria: story.acceptanceCriteria,
      priority: story.priority,
      storyPoints: story.storyPoints ?? null,
      assignee: story.assignee ?? null,
      status: story.status,
      sprint: story.sprint ?? null,
      epic: story.epic ?? null,
      tags: story.tags ?? [],
      value: story.value ?? null,
      effort: story.effort ?? null,
      hasTests:
        typeof story.hasTests === "boolean" ? story.hasTests : undefined,
      hasBlockers:
        typeof story.hasBlockers === "boolean" ? story.hasBlockers : undefined,
    };

    if (partial) {
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
    }

    return payload;
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

const userStoriesService = new UserStoriesService();
export default userStoriesService;
