// Configuration
const inferApiBaseUrl = () => {
  const override = window.__HOSTEL_CONFIG__?.API_BASE_URL;
  if (override) {
    return override;
  }

  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }

  return `${window.location.origin}/api`;
};

const CONFIG = {
  API_BASE_URL: inferApiBaseUrl(),
  MAX_OVERNIGHT_NIGHTS: 3,
  FILE_SIZE_LIMIT: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  TOKEN_KEY: 'hostel_token',
  USER_KEY: 'hostel_user'
};
