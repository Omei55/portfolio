/**
 * Error Message Component
 * Displays error messages with optional dismiss functionality
 */

import React, { useState, useEffect } from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({
  error,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
  className = '',
  showIcon = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss && error) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [error, autoDismiss, autoDismissDelay, onDismiss]);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  if (!error || !isVisible) {
    return null;
  }

  const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';

  return (
    <div
      className={`error-message-container ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <svg
          className="error-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 6V10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 14H10.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div className="error-message-content">
        <p className="error-message-text">{errorMessage}</p>
      </div>
      {onDismiss && (
        <button
          className="error-dismiss-button"
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          aria-label="Dismiss error"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

