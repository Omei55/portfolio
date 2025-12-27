/**
 * Login Component
 * Handles user authentication
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "./ErrorAlert";
import ValidationError from "./ValidationError";
import "./Login.css";

const Login = ({ onLoginSuccess }) => {
  const { login, error, loading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when component mounts or form changes
  useEffect(() => {
    clearError();
  }, [clearError]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    // Clear general error
    if (error) {
      clearError();
    }
  };

  /**
   * Validate form data
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    const errors = {};

    // Email validation - backend requires email format
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      // Error is already set in context
      console.error("Login failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>AgilePulse System</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <ErrorAlert
              message={error}
              onClose={clearError}
              type="error"
              dismissible={true}
            />
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={formErrors.email ? "input-error" : ""}
              placeholder="Enter your email address"
              disabled={isSubmitting || loading}
              autoComplete="email"
            />
            {formErrors.email && <ValidationError message={formErrors.email} />}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={formErrors.password ? "input-error" : ""}
              placeholder="Enter your password"
              disabled={isSubmitting || loading}
              autoComplete="current-password"
            />
            {formErrors.password && (
              <ValidationError message={formErrors.password} />
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <a href="/sign-up" className="link">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
