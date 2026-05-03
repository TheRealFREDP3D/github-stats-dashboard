/**
 * OAuth utilities using GitHub App web application flow
 * https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-a-login-with-github-button-with-a-github-app
 */

import {
  generateCodeVerifier,
  generateCodeChallenge,
  storePKCEParams,
  clearPKCEParams,
  validateState,
} from './pkce';

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
 * Initiates GitHub OAuth login with PKCE flow
 */
export async function initiateGitHubLogin(): Promise<void> {
  try {
    // Generate PKCE parameters
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Store PKCE parameters for later use
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
    // Re-throw with user-friendly message
    console.error("OAuth login failed:", error);
    throw new Error(handleOAuthError(error));
  }
}

// Re-export PKCE utilities
export {
  generateCodeVerifier,
  generateCodeChallenge,
  storePKCEParams,
  getPKCEParams,
  clearPKCEParams,
  validateState,
} from './pkce';

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
