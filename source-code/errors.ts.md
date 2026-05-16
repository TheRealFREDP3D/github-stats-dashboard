# Error Handling System - Structured Error Management

```typescript
// Error codes for structured error handling
export enum ErrorCode {
  INVALID_USERNAME_FORMAT = 'INVALID_USERNAME_FORMAT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_FORBIDDEN = 'API_FORBIDDEN',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error messages mapping
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_USERNAME_FORMAT]: 
    "Invalid GitHub username. Usernames must be 1-39 characters long and can only contain letters, numbers, and hyphens (cannot start or end with a hyphen).",
  
  [ErrorCode.API_RATE_LIMIT]: 
    "GitHub API error: 403 Forbidden. This could be due to:\n• API rate limit exceeded for unauthenticated requests\n• Try again in a few minutes or use an access token",
  
  [ErrorCode.API_FORBIDDEN]: 
    "GitHub API error: 403 Forbidden. This could be due to:\n• Invalid or expired access token\n• Token lacks required permissions (repo or public_repo scope)\n• API rate limit exceeded",
  
  [ErrorCode.API_NOT_FOUND]: 
    "GitHub API error: 404 Not Found. The user may not exist or has no public repositories.",
  
  [ErrorCode.API_UNAUTHORIZED]: 
    "GitHub API error: 401 Unauthorized. The access token is invalid or has been revoked.",
  
  [ErrorCode.NETWORK_ERROR]: 
    "Network error: Unable to connect to GitHub API. Please check your internet connection.",
  
  [ErrorCode.UNKNOWN_ERROR]: 
    "An unexpected error occurred. Please try again.",
};

// Helper function to create structured error objects
export interface GitHubError {
  code: ErrorCode;
  message: string;
  status?: number;
}

export function createGitHubError(code: ErrorCode, status?: number): GitHubError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    status,
  };
}

// Helper function to determine error code from HTTP status and context
export function getErrorCodeFromStatus(status: number, hasToken: boolean): ErrorCode {
  switch (status) {
    case 401:
      return ErrorCode.API_UNAUTHORIZED;
    case 403:
      return hasToken ? ErrorCode.API_FORBIDDEN : ErrorCode.API_RATE_LIMIT;
    case 404:
      return ErrorCode.API_NOT_FOUND;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}
```

## Key Features

- **Structured Error Codes**: Enum-based error classification
- **Detailed Messages**: User-friendly error messages with context
- **Status Mapping**: Automatic error code detection from HTTP status
- **Type Safety**: TypeScript interfaces for error objects
- **Context Awareness**: Different error handling for authenticated vs unauthenticated requests

## Usage Examples

```typescript
// Create error from status code
const errorCode = getErrorCodeFromStatus(403, true); // API_FORBIDDEN
const error = createGitHubError(errorCode, 403);

// Handle different error types
switch (error.code) {
  case ErrorCode.API_RATE_LIMIT:
    // Show retry after message
    break;
  case ErrorCode.API_UNAUTHORIZED:
    // Redirect to login
    break;
}
```
