/**
 * Environment Configuration Utility
 *
 * This module provides type-safe access to environment variables with validation
 * and default values. All VITE_ prefixed variables are available in the browser.
 *
 * Usage:
 * ```typescript
 * import { env } from '@/lib/env';
 *
 * const apiUrl = env.GITHUB_API_URL;
 * const debug = env.DEBUG;
 * const cacheTime = env.CACHE_DURATION;
 * ```
 */

/**
 * Parse a boolean string value
 */
function parseBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Parse a number string value
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse a string value with optional default
 */
function parseString(
  value: string | undefined,
  defaultValue: string = ""
): string {
  return value ?? defaultValue;
}

/**
 * Environment configuration object with type-safe access
 * All values are validated and have sensible defaults
 */
export const env = {
  // Application Configuration
  get NODE_ENV(): "development" | "production" | "test" {
    return (import.meta.env.MODE || "production") as
      | "development"
      | "production"
      | "test";
  },

  get PRODUCTION(): boolean {
    return this.NODE_ENV === "production";
  },

  get DEVELOPMENT(): boolean {
    return this.NODE_ENV === "development";
  },

  // GitHub API Configuration
  get GITHUB_API_URL(): string {
    return parseString(
      import.meta.env.VITE_GITHUB_API_URL,
      "https://api.github.com"
    );
  },

  get GITHUB_API_VERSION(): string {
    return parseString(import.meta.env.VITE_GITHUB_API_VERSION, "2022-11-28");
  },

  // Application Features
  get DEBUG(): boolean {
    return parseBoolean(import.meta.env.VITE_DEBUG, false);
  },

  get CACHE_DURATION(): number {
    return parseNumber(import.meta.env.VITE_CACHE_DURATION, 300000); // 5 minutes
  },

  get REPOS_PER_PAGE(): number {
    return parseNumber(import.meta.env.VITE_REPOS_PER_PAGE, 100);
  },

  get SHOW_KEYBOARD_HINT(): boolean {
    return parseBoolean(import.meta.env.VITE_SHOW_KEYBOARD_HINT, true);
  },

  // UI Configuration
  get DEFAULT_THEME(): "light" | "dark" {
    const theme = parseString(import.meta.env.VITE_DEFAULT_THEME, "light");
    return (theme === "dark" ? "dark" : "light") as "light" | "dark";
  },

  get ENABLE_DARK_MODE(): boolean {
    return parseBoolean(import.meta.env.VITE_ENABLE_DARK_MODE, true);
  },

  get ANIMATION_DURATION(): number {
    return parseNumber(import.meta.env.VITE_ANIMATION_DURATION, 300);
  },

  // Analytics Configuration
  get ENABLE_ANALYTICS(): boolean {
    return parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS, false);
  },

  get ANALYTICS_ENDPOINT(): string {
    return parseString(import.meta.env.VITE_ANALYTICS_ENDPOINT, "");
  },

  get ANALYTICS_WEBSITE_ID(): string {
    return parseString(import.meta.env.VITE_ANALYTICS_WEBSITE_ID, "");
  },

  // Logging Configuration
  get LOG_LEVEL(): "error" | "warn" | "info" | "debug" | "trace" {
    const level = parseString(import.meta.env.VITE_LOG_LEVEL, "info");
    const validLevels = ["error", "warn", "info", "debug", "trace"];
    return (validLevels.includes(level) ? level : "info") as
      | "error"
      | "warn"
      | "info"
      | "debug"
      | "trace";
  },

  get CONSOLE_LOG(): boolean {
    return parseBoolean(import.meta.env.VITE_CONSOLE_LOG, true);
  },

  // Feature Flags
  get ENABLE_SEARCH(): boolean {
    return parseBoolean(import.meta.env.VITE_ENABLE_SEARCH, true);
  },

  get ENABLE_SORT(): boolean {
    return parseBoolean(import.meta.env.VITE_ENABLE_SORT, true);
  },

  get ENABLE_KEYBOARD_NAV(): boolean {
    return parseBoolean(import.meta.env.VITE_ENABLE_KEYBOARD_NAV, true);
  },

  get ENABLE_CHARTS(): boolean {
    return parseBoolean(import.meta.env.VITE_ENABLE_CHARTS, true);
  },

  get ENABLE_DETAIL_MODAL(): boolean {
    return parseBoolean(import.meta.env.VITE_ENABLE_DETAIL_MODAL, true);
  },

  // API Rate Limiting
  get API_RATE_LIMIT(): number {
    return parseNumber(import.meta.env.VITE_API_RATE_LIMIT, 60);
  },

  get SHOW_RATE_LIMIT_WARNING(): boolean {
    return parseBoolean(import.meta.env.VITE_SHOW_RATE_LIMIT_WARNING, true);
  },

  // Data Refresh Configuration
  get AUTO_REFRESH_INTERVAL(): number {
    return parseNumber(import.meta.env.VITE_AUTO_REFRESH_INTERVAL, 0);
  },

  get CACHE_REPOS(): boolean {
    return parseBoolean(import.meta.env.VITE_CACHE_REPOS, true);
  },

  // Build Configuration
  get BUILD_DIR(): string {
    return parseString(import.meta.env.VITE_BUILD_DIR, "dist");
  },

  get SOURCEMAP(): boolean {
    return parseBoolean(import.meta.env.VITE_SOURCEMAP, false);
  },

  // OAuth Configuration
  get OAUTH_PORTAL_URL(): string {
    return parseString(import.meta.env.VITE_OAUTH_PORTAL_URL, "");
  },

  get APP_ID(): string {
    return parseString(import.meta.env.VITE_APP_ID, "");
  },

  // Development Authentication
  get GITHUB_PERSONAL_TOKEN(): string {
    return parseString(import.meta.env.VITE_GITHUB_PERSONAL_TOKEN, "");
  },
} as const;

/**
 * Logger utility that respects LOG_LEVEL configuration
 */
export const logger = {
  /**
   * Log error messages
   */
  error(...args: unknown[]): void {
    if (env.CONSOLE_LOG) {
      console.error("[ERROR]", ...args);
    }
  },

  /**
   * Log warning messages
   */
  warn(...args: unknown[]): void {
    if (env.CONSOLE_LOG && ["error", "warn"].includes(env.LOG_LEVEL)) {
      console.warn("[WARN]", ...args);
    }
  },

  /**
   * Log info messages
   */
  info(...args: unknown[]): void {
    if (env.CONSOLE_LOG && ["error", "warn", "info"].includes(env.LOG_LEVEL)) {
      console.info("[INFO]", ...args);
    }
  },

  /**
   * Log debug messages
   */
  debug(...args: unknown[]): void {
    if (
      env.CONSOLE_LOG &&
      ["error", "warn", "info", "debug"].includes(env.LOG_LEVEL)
    ) {
      console.debug("[DEBUG]", ...args);
    }
  },

  /**
   * Log trace messages
   */
  trace(...args: unknown[]): void {
    if (env.CONSOLE_LOG && env.LOG_LEVEL === "trace") {
      console.trace("[TRACE]", ...args);
    }
  },
};

/**
 * Validate environment configuration on startup
 * Logs warnings for invalid or missing critical variables
 */
export function validateEnvironment(): void {
  if (env.DEBUG) {
    logger.debug("Environment Configuration:", {
      NODE_ENV: env.NODE_ENV,
      GITHUB_API_URL: env.GITHUB_API_URL,
      GITHUB_API_VERSION: env.GITHUB_API_VERSION,
      DEBUG: env.DEBUG,
      DEFAULT_THEME: env.DEFAULT_THEME,
      ENABLE_ANALYTICS: env.ENABLE_ANALYTICS,
      LOG_LEVEL: env.LOG_LEVEL,
    });
  }

  // Validate GitHub API URL
  if (!env.GITHUB_API_URL.startsWith("http")) {
    logger.warn("Invalid GITHUB_API_URL, using default");
  }

  // Validate cache duration
  if (env.CACHE_DURATION < 0) {
    logger.warn("Invalid CACHE_DURATION, using default");
  }

  // Validate repos per page
  if (env.REPOS_PER_PAGE < 1 || env.REPOS_PER_PAGE > 100) {
    logger.warn("REPOS_PER_PAGE should be between 1 and 100");
  }

  // Validate animation duration
  if (env.ANIMATION_DURATION < 0) {
    logger.warn("Invalid ANIMATION_DURATION, using default");
  }

  // Validate analytics configuration
  if (env.ENABLE_ANALYTICS && !env.ANALYTICS_ENDPOINT) {
    logger.warn("Analytics enabled but ANALYTICS_ENDPOINT not configured");
  }

  // Validate API rate limit
  if (env.API_RATE_LIMIT < 1) {
    logger.warn("Invalid API_RATE_LIMIT, using default");
  }

  logger.info("Environment validation completed");
}

/**
 * Get all environment variables as a plain object
 * Useful for debugging or logging
 */
export function getEnvironmentSnapshot(): Record<string, unknown> {
  return {
    NODE_ENV: env.NODE_ENV,
    GITHUB_API_URL: env.GITHUB_API_URL,
    GITHUB_API_VERSION: env.GITHUB_API_VERSION,
    DEBUG: env.DEBUG,
    CACHE_DURATION: env.CACHE_DURATION,
    REPOS_PER_PAGE: env.REPOS_PER_PAGE,
    SHOW_KEYBOARD_HINT: env.SHOW_KEYBOARD_HINT,
    DEFAULT_THEME: env.DEFAULT_THEME,
    ENABLE_DARK_MODE: env.ENABLE_DARK_MODE,
    ANIMATION_DURATION: env.ANIMATION_DURATION,
    ENABLE_ANALYTICS: env.ENABLE_ANALYTICS,
    ANALYTICS_ENDPOINT: env.ANALYTICS_ENDPOINT,
    ANALYTICS_WEBSITE_ID: env.ANALYTICS_WEBSITE_ID,
    LOG_LEVEL: env.LOG_LEVEL,
    CONSOLE_LOG: env.CONSOLE_LOG,
    ENABLE_SEARCH: env.ENABLE_SEARCH,
    ENABLE_SORT: env.ENABLE_SORT,
    ENABLE_KEYBOARD_NAV: env.ENABLE_KEYBOARD_NAV,
    ENABLE_CHARTS: env.ENABLE_CHARTS,
    ENABLE_DETAIL_MODAL: env.ENABLE_DETAIL_MODAL,
    API_RATE_LIMIT: env.API_RATE_LIMIT,
    SHOW_RATE_LIMIT_WARNING: env.SHOW_RATE_LIMIT_WARNING,
    AUTO_REFRESH_INTERVAL: env.AUTO_REFRESH_INTERVAL,
    CACHE_REPOS: env.CACHE_REPOS,
    BUILD_DIR: env.BUILD_DIR,
    SOURCEMAP: env.SOURCEMAP,
    OAUTH_PORTAL_URL: env.OAUTH_PORTAL_URL,
    APP_ID: env.APP_ID,
    GITHUB_PERSONAL_TOKEN: env.GITHUB_PERSONAL_TOKEN ? "***" : "",
  };
}
