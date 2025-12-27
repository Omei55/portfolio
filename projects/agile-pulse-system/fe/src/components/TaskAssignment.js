import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import userStoriesService from '../services/userStoriesService';
import './TaskAssignment.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const TaskAssignment = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isAssigning, setIsAssigning] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  // Fetch tasks and members when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks();
      fetchTeamMembers();
    }
  }, [selectedProjectId]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects (Status: ${response.status})`);
      }

      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
      
      if (data.length === 1 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
        navigate(`/task-assignment/${data[0].id}`, { replace: true });
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userStoriesService.getAllStories();
      // Filter by project if selected
      let filteredTasks = Array.isArray(data) ? data : [];
      
      if (selectedProjectId) {
        // Filter tasks that belong to this project (you may need to adjust this based on your data structure)
        filteredTasks = filteredTasks.filter(task => 
          task.project_id === selectedProjectId || 
          task.epic === selectedProjectId ||
          !selectedProjectId
        );
      }
      
      setTasks(filteredTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    if (!selectedProjectId) {
      setTeamMembers([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedProjectId}/members`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        // If members endpoint fails, try to get users from general search
        await fetchAllUsers();
        return;
      }

      const data = await response.json();
      const mappedMembers = Array.isArray(data) ? data.map((member) => ({
        id: member.user_id || member.id,
        name: member.user?.full_name || 'Unknown',
        email: member.user?.email || 'No email',
        avatar_url: member.user?.avatar_url || null,
      })) : [];
      setTeamMembers(mappedMembers);
    } catch (err) {
      console.error('Error fetching team members:', err);
      await fetchAllUsers();
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/users/search`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const mappedUsers = Array.isArray(data) ? data.map((user) => ({
          id: user.id,
          name: user.full_name || 'Unknown',
          email: user.email || 'No email',
          avatar_url: user.avatar_url || null,
        })) : [];
        setTeamMembers(mappedUsers);
      }
    } catch (err) {
      console.error('Error fetching all users:', err);
    }
  };

  const handleProjectChange = (e) => {
    const newProjectId = e.target.value;
    if (newProjectId) {
      setSelectedProjectId(newProjectId);
      navigate(`/task-assignment/${newProjectId}`, { replace: true });
    }
  };

  const handleAssignClick = (task) => {
    setSelectedTask(task);
    setSelectedAssignee(task.assignee || '');
    setShowAssignModal(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedTask || !selectedAssignee) {
      setMessage({ type: 'error', text: 'Please select an assignee' });
      return;
    }

    setIsAssigning(true);
    setMessage({ type: '', text: '' });

    try {
      await userStoriesService.updateStory(selectedTask.id, {
        ...selectedTask,
        assignee: selectedAssignee,
      });

      setMessage({ type: 'success', text: 'Task assigned successfully!' });
      setShowAssignModal(false);
      setSelectedTask(null);
      setSelectedAssignee('');
      await fetchTasks();
    } catch (err) {
      console.error('Error assigning task:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to assign task' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (task) => {
    if (!window.confirm('Are you sure you want to unassign this task?')) {
      return;
    }

    try {
      await userStoriesService.updateStory(task.id, {
        ...task,
        assignee: null,
      });

      setMessage({ type: 'success', text: 'Task unassigned successfully!' });
      await fetchTasks();
    } catch (err) {
      console.error('Error unassigning task:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to unassign task' });
    }
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedTask(null);
    setSelectedAssignee('');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return '#e53e3e';
      case 'High':
        return '#f56565';
      case 'Medium':
        return '#ed8936';
      case 'Low':
        return '#48bb78';
      default:
        return '#718096';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done':
        return '#48bb78';
      case 'In Progress':
        return '#4299e1';
      case 'In Review':
        return '#ed8936';
      case 'To Do':
        return '#cbd5e0';
      default:
        return '#718096';
    }
  };

  const getAssigneeName = (assigneeId) => {
    if (!assigneeId) return 'Unassigned';
    const member = teamMembers.find(m => m.id === assigneeId);
    return member ? member.name : assigneeId;
  };

  const getAssigneeAvatar = (assigneeId) => {
    if (!assigneeId) return null;
    const member = teamMembers.find(m => m.id === assigneeId);
    return member ? member.avatar_url : null;
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && task.assignee) return false;
      if (assigneeFilter !== 'unassigned' && task.assignee !== assigneeFilter) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(query);
      const descMatch = task.description?.toLowerCase().includes(query);
      if (!titleMatch && !descMatch) return false;
    }
    return true;
  });

  // Show project selection if no projectId
  if (!selectedProjectId) {
    return (
      <div className="task-assignment-container">
        <div className="task-assignment-wrapper">
          <div className="assignment-header">
            <h2 className="assignment-title">Task Assignment</h2>
          </div>

          {loadingProjects ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading projects...</p>
            </div>
          ) : error && projects.length === 0 ? (
            <div className="error-container">
              <p className="error-text">{error}</p>
              <button className="btn btn-secondary" onClick={fetchProjects}>
                Retry
              </button>
            </div>
          ) : (
            <div className="project-selection-container">
              <h3 className="project-selection-title">Select a Project</h3>
              <p className="project-selection-subtitle">
                Choose a project to view and assign tasks
              </p>
              
              {projects.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">No projects found.</p>
                </div>
              ) : (
                <div className="project-select-wrapper">
                  <label htmlFor="project-select" className="project-select-label">
                    Project <span className="required">*</span>
                  </label>
                  <select
                    id="project-select"
                    className="project-select"
                    value={selectedProjectId}
                    onChange={handleProjectChange}
                  >
                    <option value="">-- Select a project --</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} {project.description ? `- ${project.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="task-assignment-container">
      <div className="task-assignment-wrapper">
        <div className="assignment-header">
          <h2 className="assignment-title">Task Assignment</h2>
          <div className="header-actions">
            {projects.length > 0 && (
              <select
                className="project-select-header"
                value={selectedProjectId}
                onChange={handleProjectChange}
                disabled={loadingProjects}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="status-filter" className="filter-label">Status</label>
            <select
              id="status-filter"
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="priority-filter" className="filter-label">Priority</label>
            <select
              id="priority-filter"
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="assignee-filter" className="filter-label">Assignee</label>
            <select
              id="assignee-filter"
              className="filter-select"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-search">
            <label htmlFor="search-input" className="filter-label">Search</label>
            <input
              id="search-input"
              type="text"
              className="filter-input"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button className="btn btn-secondary" onClick={fetchTasks}>
              Retry
            </button>
          </div>
        )}

        {/* Tasks List */}
        {!loading && !error && (
          <div className="tasks-section">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No tasks found matching your filters.</p>
              </div>
            ) : (
              <div className="tasks-grid">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-header">
                      <h3 className="task-title">{task.title || 'Untitled Task'}</h3>
                      <div className="task-badges">
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        >
                          {task.priority || 'Medium'}
                        </span>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(task.status) }}
                        >
                          {task.status || 'To Do'}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}

                    <div className="task-meta">
                      {task.storyPoints && (
                        <div className="task-meta-item">
                          <span className="meta-label">Points:</span>
                          <span className="meta-value">{task.storyPoints}</span>
                        </div>
                      )}
                      {task.sprint && (
                        <div className="task-meta-item">
                          <span className="meta-label">Sprint:</span>
                          <span className="meta-value">{task.sprint}</span>
                        </div>
                      )}
                    </div>

                    <div className="task-assignee-section">
                      <div className="assignee-info">
                        <div className="assignee-avatar">
                          {getAssigneeAvatar(task.assignee) ? (
                            <img
                              src={getAssigneeAvatar(task.assignee)}
                              alt={getAssigneeName(task.assignee)}
                              className="avatar-img"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {getAssigneeName(task.assignee).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="assignee-details">
                          <span className="assignee-label">Assigned to:</span>
                          <span className="assignee-name">
                            {getAssigneeName(task.assignee)}
                          </span>
                        </div>
                      </div>
                      <div className="task-actions">
                        <button
                          className="btn-assign"
                          onClick={() => handleAssignClick(task)}
                          title="Assign/Reassign task"
                        >
                          {task.assignee ? 'Reassign' : 'Assign'}
                        </button>
                        {task.assignee && (
                          <button
                            className="btn-unassign"
                            onClick={() => handleUnassign(task)}
                            title="Unassign task"
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignModal && selectedTask && (
          <div className="modal-overlay" onClick={handleCloseAssignModal}>
            <div className="modal-content modal-content-medium" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Assign Task</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseAssignModal}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="task-preview">
                  <h4 className="task-preview-title">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="task-preview-description">{selectedTask.description}</p>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="assignee-select" className="form-label">
                    Assign to <span className="required">*</span>
                  </label>
                  <select
                    id="assignee-select"
                    className="form-select"
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                  >
                    <option value="">-- Select assignee --</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseAssignModal}
                  className="btn btn-secondary"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignConfirm}
                  className="btn btn-primary"
                  disabled={isAssigning || !selectedAssignee}
                >
                  {isAssigning ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAssignment;

