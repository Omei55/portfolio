/**
 * Authentication Context
 * Provides authentication state and methods to child components
 */

import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authService.getToken();
        const storedUser = authService.getUser();

        if (token) {
          const verified = await authService.verifyToken();
          if (verified && verified.user) {
            setUser(verified.user);
            return;
          }

          authService.logout();
          setUser(null);
        } else if (storedUser) {
          setUser(storedUser);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError(err.message);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<void>}
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password);
      setUser(response.user || authService.getUser());
      return response;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const refreshProfile = async () => {
    try {
      setLoading(true);
      const profile = await authService.getProfile();
      if (profile?.user) {
        setUser(profile.user);
      }
      return profile;
    } catch (err) {
      console.error("Profile refresh error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = () => {
    return !!user && authService.isAuthenticated();
  };

  /**
   * Get current user
   * @returns {Object|null}
   */
  const getCurrentUser = () => {
    return user || authService.getUser();
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshProfile,
    isAuthenticated: isAuthenticated(),
    getCurrentUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use authentication context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
