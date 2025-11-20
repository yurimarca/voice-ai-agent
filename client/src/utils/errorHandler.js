/**
 * Error handling utilities for the voice agent application
 */

/**
 * Get user-friendly error messages
 */
export function getErrorMessage(error) {
  if (!error) return 'An unknown error occurred';

  // Handle specific error types
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'Microphone access was denied. Please grant permission in your browser settings.';
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'No microphone found. Please connect a microphone and try again.';
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'Microphone is already in use by another application. Please close other apps and try again.';
  }

  if (error.name === 'OverconstrainedError') {
    return 'Your microphone does not support the required audio settings.';
  }

  if (error.name === 'TypeError' || error.name === 'NotSupportedError') {
    return 'Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.';
  }

  if (error.message && error.message.includes('WebSocket')) {
    return 'Failed to connect to the server. Please ensure the server is running on port 3001.';
  }

  if (error.message && error.message.includes('API key')) {
    return 'OpenAI API key is not configured. Please check server configuration.';
  }

  // Return the error message if available
  return error.message || error.toString() || 'An unexpected error occurred';
}

/**
 * Check if browser supports required features
 */
export function checkBrowserCompatibility() {
  const errors = [];

  // Check for getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    errors.push('Your browser does not support audio recording (getUserMedia)');
  }

  // Check for AudioContext
  if (!window.AudioContext && !window.webkitAudioContext) {
    errors.push('Your browser does not support Web Audio API');
  }

  // Check for WebSocket
  if (!window.WebSocket) {
    errors.push('Your browser does not support WebSocket connections');
  }

  // Check for Promise
  if (!window.Promise) {
    errors.push('Your browser is too old and does not support modern JavaScript features');
  }

  return {
    isCompatible: errors.length === 0,
    errors,
  };
}

/**
 * Log error with context
 */
export function logError(context, error) {
  console.error(`[${context}]`, error);
  
  // In production, you might want to send errors to a logging service
  // Example: sendToLoggingService(context, error);
}

