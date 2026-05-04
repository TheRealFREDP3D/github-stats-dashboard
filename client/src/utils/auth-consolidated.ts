/**
 * Consolidated OAuth Utilities
 * Streamlined PKCE-based GitHub authentication
 */

import { generateCodeVerifier, generateCodeChallenge, storePKCEParams, clearPKCEParams, validateState, getPKCEParams } from './pkce';

// Known OAuth error types with user-friendly messages
const OAUTH_ERROR_MESSAGES = {
  NETWORK_ERROR: "Unable to connect to GitHub. Please check your internet connection and try again.",
  INVALID_CLIENT: "GitHub App configuration error. Please contact support.",
  ACCESS_DENIED: "GitHub access was denied. Please try again and ensure you grant the necessary permissions.",
  INVALID_SCOPE: "Requested permissions are not valid. Please contact support.",
  SERVER_ERROR: "GitHub is experiencing issues. Please try again in a few minutes.",
  TEMPORARILY_UNAVAILABLE: "GitHub services are temporarily unavailable. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred during GitHub authentication. Please try again.",
} as const;

type OAuthErrorType = keyof typeof OAUTH_ERROR_MESSAGES;

/**
 * Maps raw OAuth errors to user-friendly messages
 * Logs detailed errors for debugging while showing safe messages to users
 */
export function handleOAuthError(error: unknown): string {
  // Log the full error for debugging purposes
  console.error("OAuth error occurred:", error);

  // If it's not an Error object, treat as unknown error
  if (!(error instanceof Error)) {
    return OAUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  const errorMessage = error.message.toLowerCase();

  // Map known error patterns to user-friendly messages
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return OAUTH_ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (errorMessage.includes("access_denied")) {
    return OAUTH_ERROR_MESSAGES.ACCESS_DENIED;
  }

  if (errorMessage.includes("invalid_client") || errorMessage.includes("client_id")) {
    return OAUTH_ERROR_MESSAGES.INVALID_CLIENT;
  }

  if (errorMessage.includes("invalid_scope")) {
    return OAUTH_ERROR_MESSAGES.INVALID_SCOPE;
  }

  if (errorMessage.includes("server_error") || errorMessage.includes("internal server error")) {
    return OAUTH_ERROR_MESSAGES.SERVER_ERROR;
  }

  if (errorMessage.includes("temporarily_unavailable")) {
    return OAUTH_ERROR_MESSAGES.TEMPORARILY_UNAVAILABLE;
  }

  // Default to generic message for unknown errors
  return OAUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Type for OAuth error handling in components
 */
export interface OAuthError {
  message: string;
  type: OAuthErrorType;
  originalError?: unknown;
}

/**
 * Creates a safe OAuth error object for React state
 */
export function createOAuthError(error: unknown): OAuthError {
  const message = handleOAuthError(error);
  const type = determineErrorType(error);

  return {
    message,
    type,
    originalError: error, // Store for debugging but don't expose to UI
  };
}

/**
 * Determines the error type based on the error content
 */
function determineErrorType(error: unknown): OAuthErrorType {
  if (!(error instanceof Error)) {
    return "UNKNOWN_ERROR";
  }

  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "NETWORK_ERROR";
  }

  if (errorMessage.includes("access_denied")) {
    return "ACCESS_DENIED";
  }

  if (errorMessage.includes("invalid_client") || errorMessage.includes("client_id")) {
    return "INVALID_CLIENT";
  }

  if (errorMessage.includes("invalid_scope")) {
    return "INVALID_SCOPE";
  }

  if (errorMessage.includes("server_error") || errorMessage.includes("internal server error")) {
    return "SERVER_ERROR";
  }

  if (errorMessage.includes("temporarily_unavailable")) {
    return "TEMPORARILY_UNAVAILABLE";
  }

  return "UNKNOWN_ERROR";
}

/**
 * Initiates GitHub OAuth login with PKCE flow
 * Secure, modern, and follows RFC 7636
 */
export async function initiateGitHubLogin(): Promise<void> {
  try {
    // Generate cryptographically secure PKCE parameters
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Store PKCE parameters for later validation
    storePKCEParams(codeVerifier, state);
    
    // Request OAuth URL from server with PKCE parameters
    const response = await fetch('/api/auth/github/login-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code_challenge: codeChallenge,
        state: state,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OAuth login error:", errorData);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorData.error || "Unknown error"}`);
    }

    const data = await response.json();

    if (!data.url) {
      throw new Error("No OAuth URL received from server");
    }

    // Redirect to GitHub OAuth
    window.location.href = data.url;

  } catch (error) {
    console.error("OAuth login failed:", error);
    throw new Error(handleOAuthError(error));
  }
}

/**
 * Handles OAuth callback from GitHub redirect
 * Validates PKCE parameters and exchanges code for token
 */
export async function handleOAuthCallback(urlParams: URLSearchParams): Promise<{ token: string; username: string }> {
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  if (!code || !state) {
    throw new Error('Invalid OAuth callback: missing code or state');
  }

  try {
    // Retrieve stored PKCE parameters
    const storedParams = getPKCEParams();
    
    if (!storedParams.codeVerifier || !validateState(state)) {
      throw new Error('Invalid OAuth state or missing PKCE parameters');
    }

    // Exchange authorization code for access token
    const response = await fetch('/api/auth/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: storedParams.codeVerifier,
        state,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Token exchange error:", errorData);
      throw new Error(errorData.error || 'Token exchange failed');
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('No access token received');
    }

    // Validate token with GitHub API
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Token validation failed');
    }

    const userData = await userResponse.json();

    // Clear PKCE parameters after successful authentication
    clearPKCEParams();

    return {
      token: data.access_token,
      username: userData.login,
    };

  } catch (error) {
    console.error("OAuth callback error:", error);
    throw new Error(handleOAuthError(error));
  }
}

/**
 * Validates a GitHub token by making a test API call
 */
export async function validateToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    const userData = await response.json();
    return {
      valid: true,
      username: userData.login,
    };

  } catch (error) {
    console.error("Token validation error:", error);
    return { valid: false };
  }
}

// Re-export PKCE utilities for backward compatibility
export {
  generateCodeVerifier,
  generateCodeChallenge,
  storePKCEParams,
  clearPKCEParams,
  validateState,
  getPKCEParams,
  pkceParams,
} from './pkce';
