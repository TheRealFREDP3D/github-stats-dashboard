/**
 * Development Authentication Utilities
 * 
 * This module provides token-based authentication for development mode,
 * allowing developers to use GitHub Personal Access Tokens instead of OAuth.
 */

import { env } from '@/lib/env';

export interface DevAuthState {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
  error: string | null;
}

/**
 * Validates a GitHub Personal Access Token by making a test API call
 */
export async function validatePersonalToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'QuickHubPulse-Dev',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Invalid or expired token' };
      } else if (response.status === 403) {
        return { valid: false, error: 'Token lacks required permissions' };
      } else {
        return { valid: false, error: `GitHub API error: ${response.status}` };
      }
    }

    const userData = await response.json();
    return {
      valid: true,
      username: userData.login,
    };

  } catch (error) {
    console.error('Token validation error:', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Network error occurred' 
    };
  }
}

/**
 * Checks if development mode is enabled and a token is available
 */
export function isDevModeAvailable(): boolean {
  return env.DEVELOPMENT && Boolean(env.GITHUB_PERSONAL_TOKEN);
}

/**
 * Gets the stored personal token from environment
 */
export function getDevToken(): string | null {
  if (!env.DEVELOPMENT) {
    return null;
  }
  return env.GITHUB_PERSONAL_TOKEN || null;
}

/**
 * Authenticates using a GitHub Personal Access Token
 */
export async function authenticateWithToken(token: string): Promise<DevAuthState> {
  if (!token.trim()) {
    return {
      isAuthenticated: false,
      token: null,
      username: null,
      error: 'Token cannot be empty',
    };
  }

  try {
    const validation = await validatePersonalToken(token);
    
    if (!validation.valid) {
      return {
        isAuthenticated: false,
        token: null,
        username: null,
        error: validation.error || 'Token validation failed',
      };
    }

    return {
      isAuthenticated: true,
      token,
      username: validation.username || null,
      error: null,
    };

  } catch (error) {
    return {
      isAuthenticated: false,
      token: null,
      username: null,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Attempts automatic authentication in development mode using environment token
 */
export async function attemptDevAuth(): Promise<DevAuthState> {
  const token = getDevToken();
  
  if (!token) {
    return {
      isAuthenticated: false,
      token: null,
      username: null,
      error: null,
    };
  }

  return authenticateWithToken(token);
}

/**
 * Checks if a token looks like a valid GitHub Personal Access Token
 * This is a basic format validation, not a security check
 */
export function isValidTokenFormat(token: string): boolean {
  // GitHub Personal Access Tokens are typically 40+ characters
  // and contain alphanumeric characters
  const trimmed = token.trim();
  return trimmed.length >= 40 && /^[a-zA-Z0-9_]+$/.test(trimmed);
}

/**
 * Stores token in session storage for development mode
 */
export function storeDevToken(token: string): void {
  if (env.DEVELOPMENT) {
    sessionStorage.setItem('quickhubpulse_dev_token', token);
  }
}

/**
 * Retrieves stored token from session storage
 */
export function getStoredDevToken(): string | null {
  if (!env.DEVELOPMENT) {
    return null;
  }
  return sessionStorage.getItem('quickhubpulse_dev_token');
}

/**
 * Clears stored development token
 */
export function clearDevToken(): void {
  if (env.DEVELOPMENT) {
    sessionStorage.removeItem('quickhubpulse_dev_token');
  }
}
