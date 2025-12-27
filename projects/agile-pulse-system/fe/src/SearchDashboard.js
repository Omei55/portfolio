import React, { useState, useEffect } from "react";
import userStoriesService from "./services/userStoriesService";

/**
 * SearchDashboard Component - Linear.app-style search interface for stories
 * User Story: Search stories
 * Subtask: Search descriptions and titles
 */
export default function SearchDashboard({ onShowToast, onLogout }) {
  const [query, setQuery] = useState("");
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [error, setError] = useState(null);

  // Fetch all stories on component mount
  useEffect(() => {
    fetchStories();
  }, []);

  // Filter stories based on search query
  // Subtask: Search descriptions and titles
  useEffect(() => {
    if (!query.trim()) {
      setFilteredStories(stories);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = stories.filter((story) => {
      // Search in title
      const titleMatch = story.title?.toLowerCase().includes(searchTerm);
      // Search in description
      const descMatch = story.description?.toLowerCase().includes(searchTerm);
      // Return true if either title or description matches
      return titleMatch || descMatch;
    });

    setFilteredStories(filtered);
  }, [query, stories]);

  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userStoriesService.getAllStories();
      const storiesArray = Array.isArray(data) ? data : [];
      setStories(storiesArray);
      setFilteredStories(storiesArray);
    } catch (err) {
      setError(err.message || "Failed to load stories");
      console.error("Error fetching stories:", err);
      if (onShowToast) {
        onShowToast("Failed to load stories", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Medium":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "Low":
        return "bg-blue-50 text-blue-500 border-blue-200";
      default:
        return "bg-blue-50 text-blue-600 border-blue-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "bg-blue-600 text-white border-blue-700";
      case "In Progress":
        return "bg-blue-500 text-white border-blue-600";
      case "In Review":
        return "bg-blue-400 text-white border-blue-500";
      case "To Do":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Backlog":
        return "bg-blue-50 text-blue-600 border-blue-200";
      default:
        return "bg-blue-50 text-blue-600 border-blue-200";
    }
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Check if this part matches the search term (case-insensitive)
      const matches = part.toLowerCase() === searchTerm.toLowerCase();
      return matches ? (
        <mark key={index} className="bg-blue-200 text-blue-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  // SVG Icons
  const SearchIcon = () => (
    <svg
      className="w-5 h-5 text-blue-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );

  const InboxIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  const FileIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  const FilterIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );

  const LogoutIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-50 border-r border-blue-200 flex flex-col">
        <div className="p-4 border-b border-blue-200">
          <h1 className="text-lg font-semibold text-blue-700">planeprojects</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
          <div>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors">
              <InboxIcon />
              <span>Inbox</span>
            </button>
          </div>

          <div>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors">
              <FileIcon />
              <span>My issues</span>
            </button>
          </div>

          <div>
            <p className="uppercase text-blue-600 text-xs font-semibold mb-2 px-3">
              Workspace
            </p>
            <ul className="space-y-1">
              <li>
                <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors">
                  Projects
                </button>
              </li>
              <li>
                <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors">
                  Views
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="uppercase text-blue-600 text-xs font-semibold mb-2 px-3">
              Your teams
            </p>
            <ul className="space-y-1">
              <li>
                <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors">
                  ABC
                </button>
              </li>
              <li>
                <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors">
                  Issues
                </button>
              </li>
              <li>
                <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors">
                  Projects
                </button>
              </li>
              <li>
                <button className="w-full text-left px-3 py-1.5 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors">
                  Views
                </button>
              </li>
            </ul>
          </div>

          <div>
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors text-sm">
              Import issues
            </button>
          </div>
        </nav>

        {/* Logout Button */}
        {onLogout && (
          <div className="p-4 border-t border-blue-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors text-sm"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Search Bar */}
        <div className="p-6 border-b border-blue-200">
          <div className="flex items-center bg-white px-4 py-3 rounded-lg border border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <div className="mr-3 flex-shrink-0">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Q Search stories by title or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent flex-1 outline-none text-gray-800 placeholder-gray-400 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-blue-200">
          <button
            onClick={() => setActiveTab("All")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "All"
                ? "bg-blue-600 text-white"
                : "text-blue-700 hover:text-blue-900 hover:bg-blue-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("Issues")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "Issues"
                ? "bg-blue-600 text-white"
                : "text-blue-700 hover:text-blue-900 hover:bg-blue-50"
            }`}
          >
            Issues
          </button>
          <button
            onClick={() => setActiveTab("Projects")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "Projects"
                ? "bg-blue-600 text-white"
                : "text-blue-700 hover:text-blue-900 hover:bg-blue-50"
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab("Documents")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "Documents"
                ? "bg-blue-600 text-white"
                : "text-blue-700 hover:text-blue-900 hover:bg-blue-50"
            }`}
          >
            Documents
          </button>
          <div className="flex-1"></div>
          <button className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 transition-colors flex items-center gap-2">
            <FilterIcon />
            Filter
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-blue-700">Loading stories...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchStories}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
              >
                Try again
              </button>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              {query ? (
                <>
                  <p className="text-blue-700 text-lg mb-2">No stories found</p>
                  <p className="text-blue-600 text-sm">
                    Try searching by title or description
                  </p>
                </>
              ) : (
                <div className="w-full h-full bg-white"></div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-2">
              {filteredStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white border border-blue-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-900 flex-1 pr-4">
                      {highlightText(story.title || "Untitled Story", query)}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {story.priority && (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(
                            story.priority
                          )}`}
                        >
                          {story.priority}
                        </span>
                      )}
                      {story.status && (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(
                            story.status
                          )}`}
                        >
                          {story.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {story.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {highlightText(story.description, query)}
                    </p>
                  )}

                  {story.assignee && (
                    <div className="text-xs text-blue-600">
                      <span className="font-medium">Assignee:</span>{" "}
                      {story.assignee}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
