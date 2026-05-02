/**
 * Secure OAuth error handling utilities
 * Prevents leaking sensitive error information to users
 */

// Known OAuth error types with user-friendly messages
const OAUTH_ERROR_MESSAGES = {
  NETWORK_ERROR: "Unable to connect to GitHub. Please check your internet connection and try again.",
  INVALID_CLIENT: "GitHub authentication configuration error. Please contact support.",
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
  console.error('OAuth error occurred:', error);

  // If it's not an Error object, treat as unknown error
  if (!(error instanceof Error)) {
    return OAUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  const errorMessage = error.message.toLowerCase();
  
  // Map known error patterns to user-friendly messages
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return OAUTH_ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (errorMessage.includes('access_denied')) {
    return OAUTH_ERROR_MESSAGES.ACCESS_DENIED;
  }
  
  if (errorMessage.includes('invalid_client') || errorMessage.includes('client_id')) {
    return OAUTH_ERROR_MESSAGES.INVALID_CLIENT;
  }
  
  if (errorMessage.includes('invalid_scope')) {
    return OAUTH_ERROR_MESSAGES.INVALID_SCOPE;
  }
  
  if (errorMessage.includes('server_error') || errorMessage.includes('internal server error')) {
    return OAUTH_ERROR_MESSAGES.SERVER_ERROR;
  }
  
  if (errorMessage.includes('temporarily_unavailable')) {
    return OAUTH_ERROR_MESSAGES.TEMPORARILY_UNAVAILABLE;
  }

  // Default to generic message for unknown errors
  return OAUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Initiates GitHub OAuth login with proper error handling
 */
export async function initiateGitHubLogin(): Promise<void> {
  try {
    // This would typically call your backend to get the OAuth URL
    const response = await fetch('/.netlify/functions/github-login-url');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.url) {
      throw new Error('No OAuth URL received from server');
    }
    
    // Redirect to GitHub OAuth
    window.location.href = data.url;
    
  } catch (error) {
    // Re-throw with user-friendly message
    throw new Error(handleOAuthError(error));
  }
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
    return 'UNKNOWN_ERROR';
  }
  
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'NETWORK_ERROR';
  }
  
  if (errorMessage.includes('access_denied')) {
    return 'ACCESS_DENIED';
  }
  
  if (errorMessage.includes('invalid_client') || errorMessage.includes('client_id')) {
    return 'INVALID_CLIENT';
  }
  
  if (errorMessage.includes('invalid_scope')) {
    return 'INVALID_SCOPE';
  }
  
  if (errorMessage.includes('server_error') || errorMessage.includes('internal server error')) {
    return 'SERVER_ERROR';
  }
  
  if (errorMessage.includes('temporarily_unavailable')) {
    return 'TEMPORARILY_UNAVAILABLE';
  }
  
  return 'UNKNOWN_ERROR';
}
