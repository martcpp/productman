// ===========================================
// APPLICATION CONFIGURATION
// ===========================================
// Central configuration file for all environment variables

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  },

  // Authentication Settings
  auth: {
    storageKey: import.meta.env.VITE_AUTH_STORAGE_KEY || 'auth',
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 60,
  },

  // Application Settings
  app: {
    name: import.meta.env.VITE_APP_NAME || 'E-commerce Catalog',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.VITE_NODE_ENV || 'development',
  },

  // UI Configuration
  ui: {
    itemsPerPage: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE) || 12,
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10,
    supportedImageFormats: (import.meta.env.VITE_SUPPORTED_IMAGE_FORMATS || 'jpg,jpeg,png,gif,webp').split(','),
    notificationTimeout: parseInt(import.meta.env.VITE_NOTIFICATION_TIMEOUT) || 5000,
  },

  // Feature Flags
  features: {
    adminPanel: import.meta.env.VITE_ENABLE_ADMIN_PANEL === 'true',
    cart: import.meta.env.VITE_ENABLE_CART === 'true',
    search: import.meta.env.VITE_ENABLE_SEARCH === 'true',
    categories: import.meta.env.VITE_ENABLE_CATEGORIES === 'true',
    userRegistration: import.meta.env.VITE_ENABLE_USER_REGISTRATION === 'true',
  },

  // Development Settings
  development: {
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    devTools: import.meta.env.VITE_DEV_TOOLS === 'true',
  },

  // Performance Settings
  performance: {
    lazyLoading: import.meta.env.VITE_LAZY_LOADING === 'true',
    cacheDuration: parseInt(import.meta.env.VITE_CACHE_DURATION) || 30,
  },

  // Analytics & Monitoring
  analytics: {
    gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID || null,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || null,
  },
};

// Helper functions
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isFeatureEnabled = (feature) => config.features[feature] || false;

// Debug helper
if (config.development.debugMode) {
  console.log('🔧 Application Configuration:', config);
}

export default config;
