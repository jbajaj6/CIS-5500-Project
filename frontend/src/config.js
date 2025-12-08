/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints and request settings.
 * The API base URL can be configured via environment variables for
 * different deployment environments (development, staging, production).
 * 
 * Environment Variable:
 * - VITE_API_BASE_URL: Base URL for the backend API (defaults to localhost:3000)
 * 
 * @module config
 */

const config = {
  /** Base URL for all API requests */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  /** Request timeout in milliseconds (30 seconds) */
  apiTimeout: 30000,
};

export default config;
