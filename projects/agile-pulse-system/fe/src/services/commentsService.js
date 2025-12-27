/**
 * Comments Service
 * Handles comments data management and API communication for stories
 */

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");
const COMMENTS_ENDPOINT = `${API_BASE_URL}/api/comments`;

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

class CommentsService {
  /**
   * Get all comments for a story
   * @param {string} storyId - Story ID
   * @returns {Promise<Array>} Array of comments
   */
  async getCommentsByStoryId(storyId) {
    if (!storyId) {
      throw new Error("Story ID is required");
    }

    try {
      const url = new URL(COMMENTS_ENDPOINT);
      url.searchParams.set("storyId", storyId);
      
      const comments = await this.requestJson(url.toString(), {
        method: "GET",
      });

      return Array.isArray(comments) ? comments : [];
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  }

  /**
   * Get all comments for a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Array>} Array of comments
   */
  async getCommentsByTaskId(taskId) {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    try {
      const url = new URL(COMMENTS_ENDPOINT);
      url.searchParams.set("taskId", taskId);
      
      const comments = await this.requestJson(url.toString(), {
        method: "GET",
      });

      return Array.isArray(comments) ? comments : [];
    } catch (error) {
      console.error("Error fetching task comments:", error);
      throw error;
    }
  }

  /**
   * Get a single comment by ID
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} Comment object
   */
  async getCommentById(commentId) {
    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    try {
      const comment = await this.requestJson(
        `${COMMENTS_ENDPOINT}/${commentId}`,
        {
          method: "GET",
        }
      );
      return comment;
    } catch (error) {
      console.error("Error fetching comment:", error);
      throw error;
    }
  }

  /**
   * Create a new comment
   * @param {string} storyId - Story ID (optional if taskId is provided)
   * @param {Object} commentData - Comment data { content, taskId? }
   * @returns {Promise<Object>} Created comment
   */
  async createComment(storyId, commentData) {
    if (!storyId && !commentData?.taskId) {
      throw new Error("Either Story ID or Task ID is required");
    }

    if (!commentData || !commentData.content) {
      throw new Error("Content is required");
    }

    try {
      const payload = {
        content: commentData.content.trim(),
      };

      if (storyId) {
        payload.storyId = storyId;
      } else if (commentData.taskId) {
        payload.taskId = commentData.taskId;
      }

      const comment = await this.requestJson(COMMENTS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return comment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  /**
   * Update a comment
   * @param {string} commentId - Comment ID
   * @param {Object} commentData - Updated comment data { content }
   * @returns {Promise<Object>} Updated comment
   */
  async updateComment(commentId, commentData) {
    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    if (!commentData || !commentData.content) {
      throw new Error("Content is required");
    }

    try {
      const comment = await this.requestJson(
        `${COMMENTS_ENDPOINT}/${commentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            content: commentData.content.trim(),
          }),
        }
      );

      return comment;
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    try {
      await this.requestJson(`${COMMENTS_ENDPOINT}/${commentId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }

  /**
   * Make an authenticated request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
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

const commentsService = new CommentsService();
export default commentsService;
