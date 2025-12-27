/**
 * Task Service
 * Handles task data management and persistence
 * Tasks are automatically created for each user story
 */

const STORAGE_KEY = "agilepulse_tasks";
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

class TaskService {
  /**
   * Map frontend task format to backend format
   * @param {Object} taskData - Frontend task data
   * @returns {Object} Backend task data
   */
  mapToBackendFormat(taskData) {
    return {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      assigneeId: taskData.assigneeId || taskData.assignee_id,
      storyId: taskData.storyId || taskData.story_id,
      projectId: taskData.projectId || taskData.project_id,
      sprintId: taskData.sprintId || taskData.sprint_id,
      dueDate: taskData.dueDate || taskData.due_date,
      estimatedHours: taskData.estimatedHours || taskData.estimated_hours,
      tags: taskData.tags,
    };
  }

  /**
   * Map backend task format to frontend format
   * @param {Object} task - Backend task data
   * @returns {Object} Frontend task data
   */
  mapToFrontendFormat(task) {
    if (!task) return null;
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assigneeId || task.assignee_id, // For display
      assigneeId: task.assigneeId || task.assignee_id, // For API calls
      storyId: task.storyId || task.story_id,
      projectId: task.projectId || task.project_id,
      sprintId: task.sprintId || task.sprint_id,
      dueDate: task.dueDate || task.due_date,
      estimatedHours: task.estimatedHours || task.estimated_hours,
      actualHours: task.actualHours || task.actual_hours,
      tags: task.tags || [],
      createdAt: task.createdAt || task.created_at,
      updatedAt: task.updatedAt || task.updated_at,
    };
  }

  /**
   * Create a task for a user story
   * @param {Object} taskData - Task data including storyId
   * @returns {Promise<Object>} Created task
   */
  async createTask(taskData) {
    try {
      // Try to create via API if endpoint exists
      const taskEndpoint = `${API_BASE_URL}/api/tasks`;
      const backendData = this.mapToBackendFormat(taskData);
      
      try {
        const createdTask = await this.requestJson(taskEndpoint, {
          method: "POST",
          body: JSON.stringify(backendData),
        });
        if (createdTask) {
          const frontendTask = this.mapToFrontendFormat(createdTask);
          this.saveTaskToStorage(frontendTask);
          return frontendTask;
        }
      } catch (apiError) {
        console.warn("Task API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        storyId: taskData.storyId,
        title: taskData.title || `Task for ${taskData.storyTitle || "Story"}`,
        description: taskData.description || "",
        status: taskData.status || "To Do",
        assignee: taskData.assignee || taskData.storyAssignee || null,
        assigneeId: taskData.assigneeId || taskData.assignee || null,
        priority: taskData.priority || taskData.storyPriority || "Medium",
        dueDate: taskData.dueDate || null,
        estimatedHours: taskData.estimatedHours || null,
        actualHours: taskData.actualHours || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.saveTaskToStorage(task);
      return task;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  /**
   * Create a default task for a story
   * @param {Object} story - Story object
   * @returns {Promise<Object>} Created task
   */
  async createTaskForStory(story) {
    if (!story || !story.id) {
      throw new Error("Story ID is required to create a task");
    }

    const taskData = {
      storyId: story.id,
      storyTitle: story.title,
      storyAssignee: story.assignee,
      storyPriority: story.priority,
      title: `Implement: ${story.title}`,
      description: story.description || `Task for story: ${story.title}`,
      status: "To Do",
      assignee: story.assignee || null,
      priority: story.priority || "Medium",
      dueDate: null,
      estimatedHours: story.storyPoints ? story.storyPoints * 2 : null, // Estimate: 2 hours per story point
    };

    return this.createTask(taskData);
  }

  /**
   * Get all tasks
   * @returns {Promise<Array>} Array of tasks
   */
  async getAllTasks() {
    try {
      const taskEndpoint = `${API_BASE_URL}/api/tasks`;
      try {
        const tasks = await this.requestJson(taskEndpoint, {
          method: "GET",
        });
        if (Array.isArray(tasks)) {
          const frontendTasks = tasks.map((task) => this.mapToFrontendFormat(task));
          this.saveTasksToStorage(frontendTasks);
          return frontendTasks;
        }
      } catch (apiError) {
        console.warn("Task API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      return this.getTasksFromStorage();
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return this.getTasksFromStorage();
    }
  }

  /**
   * Get tasks for a specific story
   * @param {string} storyId - Story ID
   * @returns {Promise<Array>} Array of tasks for the story
   */
  async getTasksByStoryId(storyId) {
    if (!storyId) {
      return [];
    }

    try {
      const taskEndpoint = `${API_BASE_URL}/api/tasks?storyId=${storyId}`;
      try {
        const tasks = await this.requestJson(taskEndpoint, {
          method: "GET",
        });
        if (Array.isArray(tasks)) {
          return tasks.map((task) => this.mapToFrontendFormat(task));
        }
      } catch (apiError) {
        console.warn("Task API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const allTasks = this.getTasksFromStorage();
      return allTasks.filter((task) => task.storyId === storyId);
    } catch (error) {
      console.error("Error fetching tasks by story ID:", error);
      const allTasks = this.getTasksFromStorage();
      return allTasks.filter((task) => task.storyId === storyId);
    }
  }

  /**
   * Update task status using the dedicated status endpoint
   * @param {string} taskId - Task ID
   * @param {string} status - New status value ('To Do', 'In Progress', 'In Review', 'Done', 'Blocked')
   * @returns {Promise<Object>} Updated task
   */
  async updateTaskStatus(taskId, status) {
    try {
      const statusEndpoint = `${API_BASE_URL}/api/tasks/${taskId}/status`;
      try {
        const updatedTask = await this.requestJson(statusEndpoint, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        if (updatedTask) {
          this.saveTaskToStorage(updatedTask);
          return updatedTask;
        }
      } catch (apiError) {
        console.warn("Task status API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const tasks = this.getTasksFromStorage();
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          status,
          updatedAt: new Date().toISOString(),
        };
        this.saveTasksToStorage(tasks);
        return tasks[index];
      }
      throw new Error("Task not found");
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  }

  /**
   * Update a task
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Updated task data
   * @returns {Promise<Object>} Updated task
   */
  async updateTask(taskId, taskData) {
    try {
      const taskEndpoint = `${API_BASE_URL}/api/tasks/${taskId}`;
      const backendData = this.mapToBackendFormat(taskData);
      
      try {
        const updatedTask = await this.requestJson(taskEndpoint, {
          method: "PATCH",
          body: JSON.stringify(backendData),
        });
        if (updatedTask) {
          const frontendTask = this.mapToFrontendFormat(updatedTask);
          this.saveTaskToStorage(frontendTask);
          return frontendTask;
        }
      } catch (apiError) {
        console.warn("Task API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const tasks = this.getTasksFromStorage();
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          ...taskData,
          updatedAt: new Date().toISOString(),
        };
        this.saveTasksToStorage(tasks);
        return tasks[index];
      }
      throw new Error("Task not found");
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  /**
   * Assign a task to a user
   * @param {string} taskId - Task ID
   * @param {string} assigneeId - User ID to assign to
   * @returns {Promise<Object>} Updated task
   */
  async assignTask(taskId, assigneeId) {
    try {
      const assignEndpoint = `${API_BASE_URL}/api/tasks/${taskId}/assign`;
      try {
        const updatedTask = await this.requestJson(assignEndpoint, {
          method: "POST",
          body: JSON.stringify({ assigneeId }),
        });
        if (updatedTask) {
          const frontendTask = this.mapToFrontendFormat(updatedTask);
          this.saveTaskToStorage(frontendTask);
          return frontendTask;
        }
      } catch (apiError) {
        console.warn("Task assignment API not available, using update:", apiError);
        // Fallback to regular update
        return this.updateTask(taskId, { assigneeId });
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      throw error;
    }
  }

  /**
   * Unassign a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Updated task
   */
  async unassignTask(taskId) {
    try {
      const unassignEndpoint = `${API_BASE_URL}/api/tasks/${taskId}/unassign`;
      try {
        const updatedTask = await this.requestJson(unassignEndpoint, {
          method: "POST",
        });
        if (updatedTask) {
          const frontendTask = this.mapToFrontendFormat(updatedTask);
          this.saveTaskToStorage(frontendTask);
          return frontendTask;
        }
      } catch (apiError) {
        console.warn("Task unassignment API not available, using update:", apiError);
        // Fallback to regular update
        return this.updateTask(taskId, { assigneeId: null });
      }
    } catch (error) {
      console.error("Error unassigning task:", error);
      throw error;
    }
  }

  /**
   * Assign task to sprint
   * @param {string} taskId - Task ID
   * @param {string} sprintId - Sprint ID
   * @returns {Promise<Object>} Updated task
   */
  async assignTaskToSprint(taskId, sprintId) {
    try {
      const sprintEndpoint = `${API_BASE_URL}/api/tasks/${taskId}/assign-sprint`;
      try {
        const updatedTask = await this.requestJson(sprintEndpoint, {
          method: "POST",
          body: JSON.stringify({ sprintId }),
        });
        if (updatedTask) {
          const frontendTask = this.mapToFrontendFormat(updatedTask);
          this.saveTaskToStorage(frontendTask);
          return frontendTask;
        }
      } catch (apiError) {
        console.warn("Task sprint assignment API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const tasks = this.getTasksFromStorage();
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          sprintId,
          updatedAt: new Date().toISOString(),
        };
        this.saveTasksToStorage(tasks);
        return tasks[index];
      }
      throw new Error("Task not found");
    } catch (error) {
      console.error("Error assigning task to sprint:", error);
      throw error;
    }
  }

  /**
   * Unassign task from sprint
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Updated task
   */
  async unassignTaskFromSprint(taskId) {
    try {
      const sprintEndpoint = `${API_BASE_URL}/api/tasks/${taskId}/unassign-sprint`;
      try {
        const updatedTask = await this.requestJson(sprintEndpoint, {
          method: "POST",
        });
        if (updatedTask) {
          const frontendTask = this.mapToFrontendFormat(updatedTask);
          this.saveTaskToStorage(frontendTask);
          return frontendTask;
        }
      } catch (apiError) {
        console.warn("Task sprint unassignment API not available, using localStorage:", apiError);
      }

      // Fallback to localStorage
      const tasks = this.getTasksFromStorage();
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          sprintId: null,
          updatedAt: new Date().toISOString(),
        };
        this.saveTasksToStorage(tasks);
        return tasks[index];
      }
      throw new Error("Task not found");
    } catch (error) {
      console.error("Error unassigning task from sprint:", error);
      throw error;
    }
  }

  /**
   * Delete a task
   * @param {string} taskId - Task ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTask(taskId) {
    try {
      const taskEndpoint = `${API_BASE_URL}/api/tasks/${taskId}`;
      try {
        const result = await this.requestJson(taskEndpoint, {
          method: "DELETE",
        });
        // Fallback to localStorage
        const tasks = this.getTasksFromStorage();
        const filtered = tasks.filter((t) => t.id !== taskId);
        this.saveTasksToStorage(filtered);
        return result || { message: 'Task deleted successfully' };
      } catch (apiError) {
        console.warn("Task API not available, using localStorage:", apiError);
        // Fallback to localStorage
        const tasks = this.getTasksFromStorage();
        const filtered = tasks.filter((t) => t.id !== taskId);
        this.saveTasksToStorage(filtered);
        return { message: 'Task deleted successfully' };
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }

  /**
   * Get tasks from localStorage
   * @returns {Array} Array of tasks
   */
  getTasksFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading tasks from localStorage:", error);
      return [];
    }
  }

  /**
   * Save tasks to localStorage
   * @param {Array} tasks - Array of tasks
   */
  saveTasksToStorage(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error);
    }
  }

  /**
   * Save a single task to localStorage
   * @param {Object} task - Task object
   */
  saveTaskToStorage(task) {
    const tasks = this.getTasksFromStorage();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    this.saveTasksToStorage(tasks);
  }

  /**
   * Delete tasks for a story when story is deleted
   * @param {string} storyId - Story ID
   */
  deleteTasksByStoryId(storyId) {
    const tasks = this.getTasksFromStorage();
    const filtered = tasks.filter((t) => t.storyId !== storyId);
    this.saveTasksToStorage(filtered);
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

const taskService = new TaskService();
export default taskService;
