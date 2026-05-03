# PKCE OAuth Implementation

This document describes the secure PKCE (Proof Key for Code Exchange) implementation for GitHub OAuth authentication in QuickHubPulse.

## Overview

PKCE is an OAuth 2.0 extension that provides additional security for public clients like single-page applications. It prevents authorization code interception attacks by requiring a dynamically generated code verifier.

## Security Benefits

1. **No Token Exposure**: Access tokens are never exposed in browser URLs or history
2. **Code Interception Protection**: Even if the authorization code is intercepted, it cannot be used without the code verifier
3. **State Validation**: CSRF protection through state parameters
4. **Secure Token Storage**: Tokens stored in HTTP-only cookies

## Implementation Details

### Frontend Flow

1. **Generate PKCE Parameters**:
   ```typescript
   const codeVerifier = await generateCodeVerifier();
   const codeChallenge = await generateCodeChallenge(codeVerifier);
   const state = generateRandomState();
   ```

2. **Store Parameters**:
   ```typescript
   storePKCEParams(codeVerifier, state);
   ```

3. **Request OAuth URL**:
   ```typescript
   const response = await fetch('/api/auth/github/login-url', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       code_challenge: codeChallenge,
       state: state,
     }),
   });
   ```

4. **Redirect to GitHub**:
   ```typescript
   window.location.href = data.url;
   ```

5. **Handle Callback**:
   ```typescript
   // Extract code and state from URL
   const code = urlParams.get('code');
   const state = urlParams.get('state');
   
   // Validate and exchange
   const pkceParams = getPKCEParams();
   if (validateState(state) && pkceParams.codeVerifier) {
     const response = await fetch('/api/auth/exchange-token', {
       method: 'POST',
       body: JSON.stringify({
         code: code,
         code_verifier: pkceParams.codeVerifier,
         state: state,
       }),
     });
   }
   ```

### Backend Flow

1. **GitHub Login URL Generation** (`github-login-url.ts`):
   - Accepts POST requests with `code_challenge` and `state`
   - Generates OAuth URL with PKCE parameters
   - Supports legacy GET requests for backward compatibility

2. **Token Exchange** (`exchange-token.ts`):
   - Accepts POST requests with `code`, `code_verifier`, and `state`
   - Exchanges authorization code for access token using PKCE
   - Validates all parameters before making the request

3. **OAuth Callback** (`github-callback.ts`):
   - Handles both PKCE and legacy flows
   - Validates state for legacy flow
   - Exchanges code for token with PKCE support

## API Endpoints

### POST /api/auth/github/login-url
**Request Body:**
```json
{
  "code_challenge": "base64url_encoded_sha256_hash",
  "state": "random_string"
}
```

**Response:**
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&code_challenge=...&state=..."
}
```

### POST /api/auth/exchange-token
**Request Body:**
```json
{
  "code": "authorization_code_from_github",
  "code_verifier": "original_code_verifier",
  "state": "original_state"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "github_access_token",
  "token_type": "bearer",
  "scope": "repo,user"
}
```

## Security Features

### 1. Code Generation
- **Code Verifier**: 32-byte cryptographically secure random string
- **Code Challenge**: SHA256 hash of code verifier, base64url encoded
- **State**: 16-byte cryptographically secure random string

### 2. Parameter Storage
- PKCE parameters stored in sessionStorage (cleared after use)
- Tokens stored in HTTP-only cookies (not accessible to JavaScript)

### 3. Validation
- State parameter validation prevents CSRF attacks
- Code verifier validation prevents code interception
- Token validation through GitHub API call

### 4. Error Handling
- Secure error messages that don't leak sensitive information
- Automatic cleanup of stored parameters on error
- Detailed logging for debugging (server-side only)

## Migration from Legacy Flow

The implementation supports both PKCE and legacy OAuth flows:

1. **PKCE Flow** (Recommended):
   - POST request to `/api/auth/github/login-url`
   - Direct token exchange via `/api/auth/exchange-token`

2. **Legacy Flow** (Backward Compatible):
   - GET request to `/api/auth/github/login-url`
   - Cookie-based state validation
   - Server-side token exchange

## Environment Variables

Required for both flows:
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
```

## Testing

### Manual Testing
1. Navigate to `http://localhost:3000`
2. Click "Login with GitHub"
3. Verify redirect to GitHub with PKCE parameters
4. Complete authorization
5. Verify successful token exchange and login

### Automated Testing
```bash
# Test PKCE endpoint
curl -X POST http://localhost:3000/api/auth/github/login-url \
  -H "Content-Type: application/json" \
  -d '{"code_challenge":"test","state":"test"}'

# Test token exchange
curl -X POST http://localhost:3000/api/auth/exchange-token \
  -H "Content-Type: application/json" \
  -d '{"code":"test","code_verifier":"test","state":"test"}'
```

## Browser Compatibility

PKCE requires modern browser support for:
- `crypto.subtle.digest()` (SHA-256)
- `crypto.getRandomValues()`
- `fetch()` API
- `sessionStorage`

Supported browsers:
- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 12+

## Security Considerations

1. **HTTPS Required**: PKCE should only be used over HTTPS in production
2. **Token Storage**: Access tokens stored in HTTP-only cookies
3. **Parameter Cleanup**: PKCE parameters cleared after successful exchange
4. **State Validation**: Always validate state parameter
5. **Error Logging**: Log errors server-side, not client-side

## Files Modified/Created

### Frontend
- `client/src/utils/pkce.ts` - PKCE utility functions
- `client/src/utils/oauth.ts` - Updated OAuth utilities
- `client/src/App.tsx` - PKCE callback handling

### Backend
- `netlify/functions/github-login-url.ts` - PKCE support
- `netlify/functions/github-callback.ts` - Enhanced callback handling
- `netlify/functions/exchange-token.ts` - New token exchange endpoint

### Configuration
- `netlify.toml` - Added new endpoint redirects
- `vite.config.ts` - Proxy configuration for API endpoints

## Troubleshooting

### Common Issues

1. **"Invalid OAuth state" Error**
   - Clear browser storage and try again
   - Check sessionStorage for corrupted parameters

2. **"Token exchange failed" Error**
   - Verify GitHub OAuth app configuration
   - Check environment variables
   - Ensure code verifier matches original

3. **"PKCE not supported" Error**
   - Update to modern browser
   - Check crypto.subtle support

### Debug Information

Enable debug logging by setting:
```env
DEBUG=oauth:*
```

This will provide detailed logging for:
- PKCE parameter generation
- OAuth URL construction
- Token exchange process
- Error details
