/**
 * ValidationError Component
 * Displays field-level validation errors consistently
 */

import React from "react";
import "./ErrorAlert.css";

const ValidationError = ({ message, className = "" }) => {
  if (!message) {
    return null;
  }

  return (
    <span className={`validation-error ${className}`} role="alert">
      {message}
    </span>
  );
};

export default ValidationError;
