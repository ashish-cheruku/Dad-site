import React from 'react';

/**
 * Safe error handling utilities for React components
 */

/**
 * Safely converts any error object to a string for displaying in the UI
 * Handles API validation errors with {type, loc, msg, input, url} format
 * 
 * @param {any} error - The error object or string
 * @param {string} defaultMessage - Default message if error can't be processed
 * @returns {string} A safely stringified error message
 */
export const safeErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // If error is null or undefined, return empty string
  if (error === null || error === undefined) {
    return '';
  }
  
  // If error is already a string, return it
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle array of errors (common in FastAPI validation errors)
  if (Array.isArray(error)) {
    const messages = error.map(err => {
      // Handle FastAPI validation error objects
      if (err && err.type && err.msg) {
        if (err.type === 'missing' && err.loc) {
          const fieldName = err.loc[err.loc.length - 1];
          return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        }
        return err.msg;
      }
      return String(err);
    });
    
    return messages.join('. ');
  }
  
  // If error is a FastAPI validation error with type and msg properties
  if (error && error.type && error.msg) {
    if (error.type === 'missing' && error.loc) {
      const fieldName = error.loc[error.loc.length - 1];
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    return `Error: ${error.msg}`;
  }
  
  // If error has a response with data.detail (Axios error)
  if (error.response && error.response.data) {
    // Handle FastAPI validation errors returned in response.data
    if (Array.isArray(error.response.data) && error.response.data.length > 0 && error.response.data[0].type) {
      return safeErrorMessage(error.response.data);
    }
    
    if (error.response.data.detail) {
      return error.response.data.detail;
    }
  }
  
  // If error has a detail property
  if (error.detail) {
    return error.detail;
  }
  
  // If error has a message property
  if (error.message) {
    return defaultMessage + ': ' + error.message;
  }
  
  // For other objects, try to stringify them
  try {
    return defaultMessage + ': ' + JSON.stringify(error);
  } catch (e) {
    return defaultMessage;
  }
};

/**
 * Creates a React component that safely renders an error message
 * 
 * @param {any} error - The error object or string
 * @param {string} className - CSS class for error container
 * @returns {JSX.Element|null} A JSX element or null if no error
 */
export const ErrorDisplay = ({ error, className = "bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6" }) => {
  if (!error) return null;
  
  const safeMessage = safeErrorMessage(error);
  if (!safeMessage) return null;
  
  return (
    <div className={className}>
      {safeMessage}
    </div>
  );
};

/**
 * A safe setState wrapper for error state
 * This ensures that only string errors get set in state
 * 
 * @param {Function} setErrorState - React's setState function for error state
 * @param {any} error - The error to be set
 * @param {string} defaultMessage - Default message if error can't be processed
 */
export const setSafeError = (setErrorState, error, defaultMessage = 'An error occurred') => {
  if (!error) {
    setErrorState(''); // Clear error
    return;
  }
  
  setErrorState(safeErrorMessage(error, defaultMessage));
};

export default {
  safeErrorMessage,
  ErrorDisplay,
  setSafeError
}; 