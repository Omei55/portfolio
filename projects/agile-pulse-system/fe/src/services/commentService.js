/**
 * Comment Service
 * Handles task comment data management and persistence
 */

const STORAGE_KEY = "agilepulse_task_comments";
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

class CommentService {
  /**
   * Get all comments for a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Array>} Array of comments
   */
  async getCommentsByTaskId(taskId) {
    if (!taskId) {
      return [];
    }

    try {
      const commentEndpoint = `${API_BASE_URL}/api/tasks/${taskId}/comments`;
      try {
        const comments = await this.requestJson(commentEndpoint, {
          method: "GET",
        });
        if (Array.isArray(comments)) {
          return comments;
        }
      } catch (apiError) {
        console.warn("Comment API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const allComments = this.getCommentsFromStorage();
      return allComments
        .filter((comment) => comment.taskId === taskId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error("Error fetching comments by task ID:", error);
      const allComments = this.getCommentsFromStorage();
      return allComments
        .filter((comment) => comment.taskId === taskId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  /**
   * Create a comment for a task
   * @param {string} taskId - Task ID
   * @param {Object} commentData - Comment data including content and author
   * @returns {Promise<Object>} Created comment
   */
  async createComment(taskId, commentData) {
    try {
      const commentEndpoint = `${API_BASE_URL}/api/tasks/${taskId}/comments`;
      try {
        const createdComment = await this.requestJson(commentEndpoint, {
          method: "POST",
          body: JSON.stringify(commentData),
        });
        if (createdComment) {
          this.saveCommentToStorage(createdComment);
          return createdComment;
        }
      } catch (apiError) {
        console.warn("Comment API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskId: taskId,
        content: commentData.content || "",
        authorId: commentData.authorId || commentData.author?.id || "unknown",
        authorName: commentData.authorName || commentData.author?.name || "Anonymous",
        authorEmail: commentData.authorEmail || commentData.author?.email || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.saveCommentToStorage(comment);
      return comment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  /**
   * Update a comment
   * @param {string} commentId - Comment ID
   * @param {Object} commentData - Updated comment data
   * @returns {Promise<Object>} Updated comment
   */
  async updateComment(commentId, commentData) {
    try {
      const commentEndpoint = `${API_BASE_URL}/api/comments/${commentId}`;
      try {
        const updatedComment = await this.requestJson(commentEndpoint, {
          method: "PATCH",
          body: JSON.stringify(commentData),
        });
        if (updatedComment) {
          this.saveCommentToStorage(updatedComment);
          return updatedComment;
        }
      } catch (apiError) {
        console.warn("Comment API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const comments = this.getCommentsFromStorage();
      const index = comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        comments[index] = {
          ...comments[index],
          ...commentData,
          updatedAt: new Date().toISOString(),
        };
        this.saveCommentsToStorage(comments);
        return comments[index];
      }
      throw new Error("Comment not found");
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteComment(commentId) {
    try {
      const commentEndpoint = `${API_BASE_URL}/api/comments/${commentId}`;
      try {
        await this.requestJson(commentEndpoint, {
          method: "DELETE",
        });
      } catch (apiError) {
        console.warn("Comment API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const comments = this.getCommentsFromStorage();
      const filtered = comments.filter((c) => c.id !== commentId);
      this.saveCommentsToStorage(filtered);
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }

  /**
   * Delete all comments for a task
   * @param {string} taskId - Task ID
   */
  deleteCommentsByTaskId(taskId) {
    const comments = this.getCommentsFromStorage();
    const filtered = comments.filter((c) => c.taskId !== taskId);
    this.saveCommentsToStorage(filtered);
  }

  /**
   * Get comments from localStorage
   * @returns {Array} Array of comments
   */
  getCommentsFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading comments from localStorage:", error);
      return [];
    }
  }

  /**
   * Save comments to localStorage
   * @param {Array} comments - Array of comments
   */
  saveCommentsToStorage(comments) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    } catch (error) {
      console.error("Error saving comments to localStorage:", error);
    }
  }

  /**
   * Save a single comment to localStorage
   * @param {Object} comment - Comment object
   */
  saveCommentToStorage(comment) {
    const comments = this.getCommentsFromStorage();
    const index = comments.findIndex((c) => c.id === comment.id);
    if (index !== -1) {
      comments[index] = comment;
    } else {
      comments.push(comment);
    }
    this.saveCommentsToStorage(comments);
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

const commentService = new CommentService();
export default commentService;

