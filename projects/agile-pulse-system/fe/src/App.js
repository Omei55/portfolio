import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import ViewStoryDetails from "./components/ViewStoryDetails";
import StoriesListView from "./components/StoriesListView";
import StoryCreationForm from "./components/StoryCreationForm";
import UserStories from "./components/UserStories";
import TaskBoard from "./components/TaskBoard";
import SearchDashboard from "./SearchDashboard";
import SprintManagement from "./components/SprintManagement";
import ProjectMembers from "./components/ProjectMembers";
import TaskAssignment from "./components/TaskAssignment";
import RetrospectiveBoard from "./components/RetrospectiveBoard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProjectCreationTest from "./components/ProjectCreationTest";
import { useAuth } from "./context/AuthContext";
import "./App.css";

const LoginRoute = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login onLoginSuccess={() => navigate("/dashboard")} />;
};

const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/sign-up"
            element={
              <RedirectIfAuthenticated>
                <SignUp />
              </RedirectIfAuthenticated>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stories"
            element={
              <ProtectedRoute>
                <StoriesListView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/story/create"
            element={
              <ProtectedRoute>
                <StoryCreationForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/story/:id"
            element={
              <ProtectedRoute>
                <ViewStoryDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/backlog"
            element={
              <ProtectedRoute>
                <UserStories />
              </ProtectedRoute>
            }
          />

          <Route
            path="/board"
            element={
              <ProtectedRoute>
                <TaskBoard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/taskboard"
            element={
              <ProtectedRoute>
                <TaskBoard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/project-members/:projectId?"
            element={
              <ProtectedRoute>
                <ProjectMembers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/task-assignment/:projectId?"
            element={
              <ProtectedRoute>
                <TaskAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/retrospectives"
            element={
              <ProtectedRoute>
                <RetrospectiveBoard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />

          {/* Test route for project creation modal - no authentication required */}
          <Route path="/test-project-modal" element={<ProjectCreationTest />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
