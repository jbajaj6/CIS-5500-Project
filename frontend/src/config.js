// API Configuration
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  apiTimeout: 30000, // 30 seconds
};

export default config;
