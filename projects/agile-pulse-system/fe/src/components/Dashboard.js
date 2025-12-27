import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userStoriesService from "../services/userStoriesService";
import taskService from "../services/taskService";
import ProjectCreationModal from "./ProjectCreationModal";
import SprintManagementModal from "./SprintManagementModal";
import Analytics from "./Analytics";
import ErrorAlert from "./ErrorAlert";
import ErrorPlaceholder from "./ErrorPlaceholder";
import InAppNotifications from "./InAppNotifications";
import NotificationPreferences from "./NotificationPreferences";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stories, setStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isNotificationPreferencesOpen, setIsNotificationPreferencesOpen] = useState(false);
  const [manualProjects, setManualProjects] = useState([]);

  const loadStories = useCallback(async () => {
    try {
      setLoadingStories(true);
      setError(null);
      const data = await userStoriesService.getAllStories();
      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load dashboard stories:", err);
      setError(err.message || "Failed to load stories");
    } finally {
      setLoadingStories(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const data = await taskService.getAllTasks();
      const tasksArray = Array.isArray(data) ? data : [];
      console.log("Dashboard: Loaded tasks:", tasksArray.length, tasksArray);
      setTasks(tasksArray);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      // Don't set error state, just log it
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
    loadTasks();
  }, [loadStories, loadTasks]);

  // Load manually created projects from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem("manualProjects");
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setManualProjects(Array.isArray(parsedProjects) ? parsedProjects : []);
      } catch (error) {
        console.error(
          "Error loading manual projects from localStorage:",
          error
        );
        setManualProjects([]);
      }
    }
  }, []);

  const userProfile = useMemo(() => {
    const fallbackDate = new Date().toISOString();
    return {
      name: user?.fullName || "Agile Pulse Member",
      email: user?.email || "member@agilepulse.com",
      role:
        Array.isArray(user?.roles) && user.roles.length > 0
          ? user.roles[0]
          : "Team Member",
      avatar: user?.avatarUrl || null,
      joinDate: user?.createdAt || fallbackDate,
      team: "Agile Pulse Team",
    };
  }, [user]);

  const metrics = useMemo(() => {
    if (!stories.length) {
      return {
        activeSprints: 0,
        pendingStories: 0,
        mvpStories: 0,
        nextReleaseDate: "TBD",
      };
    }

    const sprintCount = new Set(
      stories
        .map((story) => story.sprint)
        .filter((sprint) => sprint && sprint.trim())
    ).size;

    const pendingStories = stories.filter(
      (story) => story.status !== "Done"
    ).length;
    const mvpStories = stories.filter((story) =>
      ["Critical", "High"].includes(story.priority)
    ).length;

    return {
      activeSprints: sprintCount,
      pendingStories,
      mvpStories,
      nextReleaseDate: "TBD",
    };
  }, [stories]);

  const allTasks = useMemo(() => {
    // Map actual tasks to the format needed for display
    if (!tasks || tasks.length === 0) {
      return [];
    }
    return tasks.map((task) => {
      // Find the story this task belongs to for project info
      const parentStory = stories.find(
        (s) => s.id === (task.storyId || task.story_id)
      );
      // Use assigneeId for filtering, but display name if available
      const assigneeId =
        task.assigneeId || task.assignee_id || task.assignee || "unassigned";
      const assigneeName = task.assignee || task.assigneeId || "Unassigned";

      return {
        id: task.id,
        title: task.title || "Untitled Task",
        assignee: assigneeId,
        assigneeId: assigneeId,
        assigneeName: assigneeName,
        priority: task.priority || "Medium",
        status: task.status || "To Do",
        dueDate:
          task.dueDate ||
          task.updatedAt ||
          task.createdAt ||
          new Date().toISOString(),
        storyPoints: task.estimatedHours || 0,
        storyPointsLabel: task.estimatedHours ? `${task.estimatedHours}h` : "-",
        project: parentStory?.epic || parentStory?.sprint || "Backlog",
        storyId: task.storyId || task.story_id,
        description: task.description,
      };
    });
  }, [tasks, stories]);

  const teamMembers = useMemo(() => {
    const members = new Map();
    allTasks.forEach((task) => {
      const key = task.assignee || "unassigned";
      if (!members.has(key)) {
        members.set(key, {
          id: key,
          name: task.assigneeName,
          avatar: null,
        });
      }
    });

    return [
      { id: "all", name: "All Team Members" },
      ...Array.from(members.values()),
    ];
  }, [allTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    const filtered =
      selectedMember === "all"
        ? allTasks
        : allTasks.filter((task) => task.assignee === selectedMember);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "priority":
          const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          );
        case "dueDate":
          return new Date(a.dueDate) - new Date(b.dueDate);
        case "status":
          const statusOrder = {
            "To Do": 1,
            "In Progress": 2,
            "In Review": 3,
            Done: 4,
          };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        case "storyPoints":
          return b.storyPoints - a.storyPoints;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [selectedMember, sortBy, allTasks]);

  // Generate projects from stories (grouped by epic/sprint)
  const apiProjects = useMemo(() => {
    if (!stories.length) {
      return [];
    }

    const grouped = stories.reduce((acc, story) => {
      const key = story.epic || story.sprint || "Backlog";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(story);
      return acc;
    }, {});

    const palette = [
      { color: "orange", titleColor: "purple" },
      { color: "green", titleColor: "orange" },
      { color: "purple", titleColor: "green" },
    ];

    return Object.entries(grouped).map(([key, projectStories], index) => {
      const completed = projectStories.filter(
        (story) => story.status === "Done"
      ).length;
      const paletteEntry = palette[index % palette.length];
      return {
        id: key || `project-${index}`,
        title: key,
        subtitle: `${projectStories.length} stories`,
        completed,
        total: projectStories.length,
        dueDate: projectStories[0]?.sprint || "Backlog",
        color: paletteEntry.color,
        titleColor: paletteEntry.titleColor,
        isManual: false,
      };
    });
  }, [stories]);

  // Combine API projects with manually created projects
  const projects = useMemo(() => {
    // Filter out "Backlog" from API projects if it exists
    const filteredApiProjects = apiProjects.filter((p) => p.id !== "Backlog");
    return [...manualProjects, ...filteredApiProjects];
  }, [manualProjects, apiProjects]);

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleSaveProject = (newProject) => {
    // Only save to localStorage if it's a manual project (not created via API)
    if (newProject.isManual !== false) {
      const updatedProjects = [...manualProjects, newProject];
      setManualProjects(updatedProjects);
      localStorage.setItem("manualProjects", JSON.stringify(updatedProjects));
    } else {
      // API-created projects are already in the backend, no need to save to localStorage
      console.log("Project created via API, skipping localStorage save");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleViewStories = () => {
    navigate("/stories");
  };

  const handleViewTaskBoard = () => {
    navigate("/board");
  };

  const handleViewDetail = (projectId) => {
    if (!projectId || projectId === "Backlog") {
      navigate("/stories");
      return;
    }

    // Check if it's a manually created project
    const manualProject = manualProjects.find((p) => p.id === projectId);
    if (manualProject) {
      // For manually created projects, navigate to stories with a filter
      navigate("/stories");
      return;
    }

    // For API projects, find a story with matching epic/sprint
    const targetStory = stories.find((story) => {
      if (
        (story.epic && story.epic === projectId) ||
        (story.sprint && story.sprint === projectId)
      ) {
        return true;
      }
      return false;
    });

    if (targetStory?.id) {
      navigate(`/story/${targetStory.id}`);
    } else {
      navigate("/stories");
    }
  };

  const handleSearch = async (event) => {
    if (event) {
      event.preventDefault();
    }
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      await loadStories();
      return;
    }

    try {
      setIsSearching(true);
      setLoadingStories(true);
      setError(null);
      const data = await userStoriesService.searchStories(trimmedQuery);
      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to search stories:", err);
      setError(err.message || "Failed to search stories");
    } finally {
      setIsSearching(false);
      setLoadingStories(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    await loadStories();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "#e53e3e";
      case "High":
        return "#f56565";
      case "Medium":
        return "#ed8936";
      case "Low":
        return "#48bb78";
      default:
        return "#718096";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "#48bb78";
      case "In Progress":
        return "#4299e1";
      case "In Review":
        return "#ed8936";
      case "To Do":
        return "#cbd5e0";
      default:
        return "#718096";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard">
      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProject}
      />

      {/* Sprint Management Modal */}
      <SprintManagementModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
      />

      {/* Notification Preferences Modal */}
      {isNotificationPreferencesOpen && (
        <NotificationPreferences
          onClose={() => setIsNotificationPreferencesOpen(false)}
        />
      )}

      <nav className="top-nav">
        <div className="nav-content">
          <div className="nav-logo">
            <h2 className="logo-text">Agile Pulse</h2>
          </div>
          <div className="nav-right-section">
            <InAppNotifications />
            <button
              className="notification-settings-btn"
              onClick={() => setIsNotificationPreferencesOpen(true)}
              title="Notification Settings"
            >
              ⚙️
            </button>
            <div className="user-profile-nav">
              <div className="profile-avatar-nav">
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="profile-info-nav">
                <span className="profile-name-nav">{userProfile.name}</span>
                <span className="profile-role-nav">{userProfile.role}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-actions">
          <form className="story-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="story-search-input"
              placeholder="Search stories by title or description..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button
              type="submit"
              className="story-search-button"
              disabled={isSearching || loadingStories}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
            {searchQuery && (
              <button
                type="button"
                className="story-search-clear"
                onClick={handleClearSearch}
                disabled={isSearching || loadingStories}
              >
                Clear
              </button>
            )}
          </form>
          <div className="dashboard-action-buttons">
            <button
              className="create-story-button"
              onClick={() => navigate("/story/create")}
            >
              + New Story
            </button>
            <button
              className="manage-sprints-button"
              onClick={() => setIsSprintModalOpen(true)}
            >
              📋 Manage Sprints
            </button>
            <button
              className="manage-sprints-button"
              onClick={() => navigate("/project-members")}
            >
              👥 Project Members
            </button>
            <button
              className="manage-sprints-button"
              onClick={() => navigate("/task-assignment")}
            >
              📋 Task Assignment
            </button>
            <button
              className="manage-sprints-button"
              onClick={() => navigate("/analytics")}
            >
              📊 Analytics
            </button>
          </div>
        </div>

        <div className="user-profile-section">
          <div className="profile-card">
            <div className="profile-avatar">
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="avatar-img-large"
                />
              ) : (
                <div className="avatar-placeholder-large">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-details">
              <h1 className="profile-name">{userProfile.name}</h1>
              <p className="profile-email">{userProfile.email}</p>
              <div className="profile-meta">
                <div className="profile-meta-item">
                  <span className="meta-label">Role:</span>
                  <span className="meta-value">{userProfile.role}</span>
                </div>
                <div className="profile-meta-item">
                  <span className="meta-label">Team:</span>
                  <span className="meta-value">{userProfile.team}</span>
                </div>
                <div className="profile-meta-item">
                  <span className="meta-label">Member since:</span>
                  <span className="meta-value">
                    {new Date(userProfile.joinDate).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long" }
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <div className="metric-card">
            <div className="metric-title">Active Sprints</div>
            <div className="metric-value metric-purple">
              {metrics.activeSprints}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Pending Stories</div>
            <div className="metric-value metric-orange">
              {metrics.pendingStories}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-title">MVP Stories</div>
            <div className="metric-value metric-green">
              {metrics.mvpStories}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Next Release Date</div>
            <div className="metric-value metric-gray">
              {metrics.nextReleaseDate}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section-wrapper">
          <Analytics />
        </div>

        {error && (
          <div className="assigned-tasks-section">
            <ErrorAlert
              message={error}
              onClose={() => setError(null)}
              type="error"
              dismissible={true}
            />
          </div>
        )}

        <div className="assigned-tasks-section">
          <div className="tasks-header">
            <h2 className="tasks-title">Assigned Tasks</h2>
            <div className="tasks-controls">
              <div className="filter-control">
                <label htmlFor="member-filter" className="control-label">
                  Filter by Member:
                </label>
                <select
                  id="member-filter"
                  className="filter-select"
                  value={selectedMember}
                  onChange={(event) => setSelectedMember(event.target.value)}
                >
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sort-control">
                <label htmlFor="sort-by" className="control-label">
                  Sort by:
                </label>
                <select
                  id="sort-by"
                  className="sort-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                  <option value="status">Status</option>
                  <option value="storyPoints">Story Points</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          </div>

          <div className="tasks-list">
            {loadingTasks ? (
              <div className="empty-tasks">
                <p>Loading tasks...</p>
              </div>
            ) : filteredAndSortedTasks.length === 0 ? (
              <div className="empty-tasks">
                <p>
                  {tasks.length === 0
                    ? "No tasks found. Create tasks for your stories to see them here."
                    : "No tasks found for the selected filter."}
                </p>
                {tasks.length > 0 && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "8px",
                    }}
                  >
                    Total tasks: {tasks.length} | Filtered:{" "}
                    {filteredAndSortedTasks.length}
                  </p>
                )}
              </div>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h3 className="task-title">{task.title}</h3>
                    <div className="task-badges">
                      <span
                        className="priority-badge"
                        style={{
                          backgroundColor: getPriorityColor(task.priority),
                        }}
                      >
                        {task.priority}
                      </span>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <div className="task-details">
                    <div className="task-detail-item">
                      <span className="detail-label">Assigned to:</span>
                      <span className="detail-value">{task.assigneeName}</span>
                    </div>
                    <div className="task-detail-item">
                      <span className="detail-label">Project:</span>
                      <span className="detail-value">{task.project}</span>
                    </div>
                    <div className="task-detail-item">
                      <span className="detail-label">Due Date:</span>
                      <span className="detail-value">
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                    <div className="task-detail-item">
                      <span className="detail-label">Estimated Hours:</span>
                      <span className="detail-value">
                        {task.storyPointsLabel}
                      </span>
                    </div>
                    {task.storyId && (
                      <div className="task-detail-item">
                        <span className="detail-label">Story:</span>
                        <span className="detail-value">
                          <Link
                            to={`/story/${task.storyId}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: "#667eea", textDecoration: "none" }}
                          >
                            View Story →
                          </Link>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="task-actions">
                    <Link
                      to={`/story/${task.storyId || "unknown"}`}
                      className="view-task-link"
                    >
                      View Task →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="projects-section">
          <div className="projects-header">
            <h2 className="projects-title">Projects</h2>
            <div className="projects-header-buttons">
              <button className="new-project-btn" onClick={handleViewTaskBoard}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 2H6V6H2V2ZM10 2H14V6H10V2ZM2 10H6V14H2V10ZM10 10H14V14H10V10Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Task Board
              </button>
              <button className="new-project-btn" onClick={handleViewStories}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 3H14M2 8H14M2 13H14"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                View Stories
              </button>
              <button className="new-project-btn" onClick={handleNewProject}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 3V13M3 8H13"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                New Project
              </button>
            </div>
          </div>

          <div className="projects-list">
            {loadingStories ? (
              <div className="loading-state">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="empty-projects">
                No project data available yet.
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div
                    className={`project-gradient project-gradient-${project.color}`}
                  >
                    <svg
                      className="project-icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                      />
                      <path
                        d="M2 17L12 22L22 17"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                      />
                      <path
                        d="M2 12L12 17L22 12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                  <div className="project-content">
                    <div className="project-info">
                      <h3
                        className={`project-title project-title-${project.titleColor}`}
                      >
                        {project.title}
                      </h3>
                      <h4 className="project-subtitle">{project.subtitle}</h4>
                      <p className="project-status">
                        {project.completed}/{project.total} stories completed
                      </p>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              project.total
                                ? (project.completed / project.total) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="project-due">Sprint: {project.dueDate}</p>
                    </div>
                    <button
                      className="view-detail-btn"
                      onClick={() => handleViewDetail(project.id)}
                    >
                      View Detail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
