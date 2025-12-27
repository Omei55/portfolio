import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './ProjectMembers.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (id) => {
  return id && UUID_REGEX.test(id);
};

const isManualProject = (id) => {
  return id && (id.startsWith('project-') || !isValidUUID(id));
};

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

const ProjectMembers = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state for adding member
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  // Fetch members when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchMembers();
    }
  }, [selectedProjectId]);


  // Search users when query changes (only if modal is open)
  useEffect(() => {
    if (selectedProjectId && showAddModal) {
      const debounceTimer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else if (!showAddModal) {
      setSearchResults([]);
    }
  }, [searchQuery, selectedProjectId, showAddModal]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      let apiProjects = [];
      if (response.ok) {
        const data = await response.json();
        apiProjects = Array.isArray(data) ? data : [];
      } else {
        console.warn('Failed to fetch projects from API:', response.status);
      }

      // Also check localStorage for manually created projects
      let manualProjects = [];
      try {
        const savedProjects = localStorage.getItem('manualProjects');
        if (savedProjects) {
          const parsed = JSON.parse(savedProjects);
          manualProjects = Array.isArray(parsed) ? parsed : [];
          // Convert manual projects to API format
          manualProjects = manualProjects.map((p) => ({
            id: p.id,
            name: p.title || p.name,
            description: p.subtitle || p.description || '',
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Error loading manual projects from localStorage:', err);
      }

      // Combine API projects and manual projects, removing duplicates
      // Deduplicate by ID first, then by name if IDs don't match
      const projectMap = new Map();
      
      // Add API projects first (they take priority)
      apiProjects.forEach((project) => {
        projectMap.set(project.id, project);
      });
      
      // Add manual projects only if they don't already exist
      manualProjects.forEach((project) => {
        // Check if project with same ID exists
        if (!projectMap.has(project.id)) {
          // Also check if project with same name exists (to avoid duplicates)
          const existingByName = Array.from(projectMap.values()).find(
            (p) => p.name === project.name || p.name === project.title
          );
          if (!existingByName) {
            projectMap.set(project.id, project);
          }
        }
      });
      
      const allProjects = Array.from(projectMap.values());
      setProjects(allProjects);
      
      console.log('ProjectMembers: Loaded projects:', {
        api: apiProjects.length,
        manual: manualProjects.length,
        total: allProjects.length,
        duplicatesRemoved: apiProjects.length + manualProjects.length - allProjects.length,
        projects: allProjects,
      });
      
      // If there's only one project, auto-select it
      if (allProjects.length === 1 && !selectedProjectId) {
        setSelectedProjectId(allProjects[0].id);
        navigate(`/project-members/${allProjects[0].id}`, { replace: true });
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
      // Try to load from localStorage as fallback
      try {
        const savedProjects = localStorage.getItem('manualProjects');
        if (savedProjects) {
          const parsed = JSON.parse(savedProjects);
          const manualProjects = Array.isArray(parsed) ? parsed : [];
          const converted = manualProjects.map((p) => ({
            id: p.id,
            name: p.title || p.name,
            description: p.subtitle || p.description || '',
          }));
          setProjects(converted);
          setError(null);
        } else {
          setProjects([]);
        }
      } catch (localErr) {
        console.error('Error loading from localStorage:', localErr);
        setProjects([]);
      }
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchMembers = async () => {
    if (!selectedProjectId) {
      setError('Please select a project');
      setLoading(false);
      return;
    }

    // Check if this is a manual project (not a valid UUID)
    if (isManualProject(selectedProjectId)) {
      setLoading(false);
      setError('Manual projects (created locally) do not support member management. Please create projects through the backend API to manage members.');
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedProjectId}/members`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('You do not have permission to view this project');
        }
        throw new Error(`Failed to fetch members (Status: ${response.status})`);
      }

      const data = await response.json();
      // Handle wrapped API response
      const responseData = data?.data || data;
      // Map API response to component format
      const mappedMembers = Array.isArray(responseData) ? responseData.map((member) => ({
        id: member.id || member.user_id,
        user_id: member.user_id,
        name: member.user?.full_name || 'Unknown',
        email: member.user?.email || 'No email',
        role: Array.isArray(member.user?.roles) && member.user.roles.length > 0
          ? member.user.roles[0]
          : 'Developer',
        avatar_url: member.user?.avatar_url || null,
        joined_at: member.joined_at,
      })) : [];
      setMembers(mappedMembers);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err.message || 'Failed to load members. Please try again.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!selectedProjectId) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      // Always include query parameter, even if empty (to get all users)
      const queryParam = `?query=${encodeURIComponent(searchQuery.trim() || '')}`;
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedProjectId}/users/search${queryParam}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          // If guard blocks, try the general search endpoint
          return await searchAllUsers();
        }
        throw new Error(`Failed to search users (Status: ${response.status})`);
      }

      const data = await response.json();
      // Handle wrapped API response
      const responseData = data?.data || data;
      const mappedUsers = Array.isArray(responseData) ? responseData.map((user) => ({
        id: user.id,
        name: user.full_name || 'Unknown',
        email: user.email || 'No email',
        role: Array.isArray(user.roles) && user.roles.length > 0
          ? user.roles[0]
          : 'Developer',
        avatar_url: user.avatar_url || null,
      })) : [];
      setSearchResults(mappedUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      // Fallback to general search if project-specific search fails
      await searchAllUsers();
    } finally {
      setSearchingUsers(false);
    }
  };

  const searchAllUsers = async () => {
    try {
      const queryParam = searchQuery.trim() ? `?query=${encodeURIComponent(searchQuery.trim())}` : '';
      const response = await fetch(
        `${API_BASE_URL}/api/projects/users/search${queryParam}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search users (Status: ${response.status})`);
      }

      const data = await response.json();
      // Handle wrapped API response
      const responseData = data?.data || data;
      const mappedUsers = Array.isArray(responseData) ? responseData.map((user) => ({
        id: user.id,
        name: user.full_name || 'Unknown',
        email: user.email || 'No email',
        role: Array.isArray(user.roles) && user.roles.length > 0
          ? user.roles[0]
          : 'Developer',
        avatar_url: user.avatar_url || null,
      })) : [];
      setSearchResults(mappedUsers);
    } catch (err) {
      console.error('Error searching all users:', err);
      setSearchResults([]);
    }
  };

  const handleProjectChange = (e) => {
    const newProjectId = e.target.value;
    if (newProjectId) {
      setSelectedProjectId(newProjectId);
      navigate(`/project-members/${newProjectId}`, { replace: true });
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUserId(user.id);
    setSearchQuery(user.email || user.name);
    setSearchResults([]);
    setFormErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedUserId) {
      newErrors.user = 'Please select a user to add';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!selectedProjectId) {
      showError('Please select a project');
      return;
    }

    // Check if this is a manual project
    if (isManualProject(selectedProjectId)) {
      showError('Manual projects (created locally) do not support member management. Please create projects through the backend API to manage members.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedProjectId}/members`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ user_id: selectedUserId }),
        }
      );

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Failed to add member (Status: ${response.status})`;
        
        if (isJson) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = responseText || errorMessage;
          }
        } else {
          errorMessage = responseText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = isJson ? JSON.parse(responseText) : {};
      const message = responseData?.message || 'Member added successfully!';
      showSuccess(message);
      setShowAddModal(false);
      setSelectedUserId('');
      setSearchQuery('');
      setSearchResults([]);
      setFormErrors({});
      
      // Refresh members list
      await fetchMembers();
    } catch (err) {
      console.error('Error adding member:', err);
      let errorMessage = err.message || 'Failed to add member. Please try again.';
      
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        errorMessage = 'Cannot connect to backend server. Please ensure the backend server is running on http://localhost:3001';
      }
      
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete || !selectedProjectId) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedProjectId}/members/${memberToDelete.user_id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Failed to remove member (Status: ${response.status})`;
        
        if (isJson) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = responseText || errorMessage;
          }
        } else {
          errorMessage = responseText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = isJson ? JSON.parse(responseText) : {};
      const message = responseData?.message || 'Member removed successfully!';
      showSuccess(message);
      setShowDeleteModal(false);
      setMemberToDelete(null);
      
      // Refresh members list
      await fetchMembers();
    } catch (err) {
      console.error('Error deleting member:', err);
      let errorMessage = err.message || 'Failed to remove member. Please try again.';
      
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        errorMessage = 'Cannot connect to backend server. Please ensure the backend server is running on http://localhost:3001';
      }
      
      showError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setMemberToDelete(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedUserId('');
    setSearchQuery('');
    setSearchResults([]);
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setSearchQuery('');
    setSelectedUserId('');
    setSearchResults([]);
    // Trigger search immediately when modal opens
    if (selectedProjectId) {
      setTimeout(() => {
        searchUsers();
      }, 100);
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      'Product Owner': 'role-badge-po',
      'Scrum Master': 'role-badge-sm',
      'Developer': 'role-badge-dev',
      'Stakeholder': 'role-badge-stakeholder'
    };
    return roleMap[role] || 'role-badge-default';
  };

  // Show project selection if no projectId
  if (!selectedProjectId) {
    return (
      <div className="project-members-container">
        <div className="project-members-wrapper">
          <div className="members-header">
            <h2 className="members-title">Project Members</h2>
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
                Choose a project to view and manage its members
              </p>
              
              {projects.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">No projects found.</p>
                  <p className="empty-state-text" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#718096' }}>
                    Create a project first to manage its members.
                  </p>
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
    <div className="project-members-container">
      <div className="project-members-wrapper">
        <div className="members-header">
          <h2 className="members-title">Project Members</h2>
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
            <button
              className="btn btn-primary"
              onClick={handleOpenAddModal}
              disabled={loading || !selectedProjectId || isManualProject(selectedProjectId)}
              title={isManualProject(selectedProjectId) ? 'Manual projects do not support member management' : ''}
            >
              + Add Member
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading members...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button className="btn btn-secondary" onClick={fetchMembers}>
              Retry
            </button>
          </div>
        )}

        {/* Members List */}
        {!loading && !error && (
          <div className="members-list">
            {members.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No members found. Add your first team member!</p>
              </div>
            ) : (
              <div className="members-grid">
                {members.map((member) => (
                  <div key={member.id || member.user_id} className="member-card">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="avatar-img" />
                        ) : (
                          member.name ? member.name.charAt(0).toUpperCase() : '?'
                        )}
                      </div>
                      <div className="member-details">
                        <h3 className="member-name">{member.name || 'Unknown'}</h3>
                        <p className="member-email">{member.email || 'No email'}</p>
                        <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                          {member.role || 'Developer'}
                        </span>
                      </div>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(member)}
                      aria-label={`Remove ${member.name}`}
                      title="Remove member"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={handleCloseAddModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Add New Member</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseAddModal}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddMember} className="add-member-form">
                <div className="form-group">
                  <label htmlFor="user-search" className="form-label">
                    Search User <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="user-search"
                    name="user-search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedUserId('');
                    }}
                    className={`form-input ${formErrors.user ? 'input-error' : ''}`}
                    placeholder="Search by email or name..."
                    autoFocus
                  />
                  {formErrors.user && <span className="error-message">{formErrors.user}</span>}
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="search-results-dropdown">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className={`search-result-item ${selectedUserId === user.id ? 'selected' : ''}`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="search-result-avatar">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} />
                            ) : (
                              user.name ? user.name.charAt(0).toUpperCase() : '?'
                            )}
                          </div>
                          <div className="search-result-info">
                            <div className="search-result-name">{user.name}</div>
                            <div className="search-result-email">{user.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchingUsers && (
                    <div className="search-loading">Searching users...</div>
                  )}
                  
                  {selectedUserId && searchQuery && !searchingUsers && (
                    <div className="selected-user-indicator">
                      ✓ User selected: {searchQuery}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !selectedUserId}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && memberToDelete && (
          <div className="modal-overlay" onClick={handleDeleteCancel}>
            <div className="modal-content modal-content-small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Remove Member</h3>
                <button
                  className="modal-close"
                  onClick={handleDeleteCancel}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <div className="delete-confirmation-content">
                <p className="delete-confirmation-text">
                  Are you sure you want to remove <strong>{memberToDelete.name}</strong> from the project?
                </p>
                <p className="delete-confirmation-warning">
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="btn btn-secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="btn btn-danger"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Removing...' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMembers;
