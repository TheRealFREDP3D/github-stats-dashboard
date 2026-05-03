/**
 * PKCE (Proof Key for Code Exchange) utilities for secure OAuth flow
 * Implements RFC 7636 for public clients
 */

/**
 * Generates a cryptographically random code verifier
 * @returns {string} A random string suitable for PKCE
 */
export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Convert to base64url encoding
  return base64urlEncode(array);
}

/**
 * Generates a code challenge from the code verifier
 * @param codeVerifier - The code verifier to hash
 * @returns {string} The SHA256 hash of the code verifier, base64url encoded
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url encoding
  return base64urlEncode(new Uint8Array(hashBuffer));
}

/**
 * Encodes Uint8Array to base64url string
 * @param buffer - The buffer to encode
 * @returns {string} Base64url encoded string
 */
function base64urlEncode(buffer: Uint8Array): string {
  // Convert Uint8Array to string manually for better compatibility
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Stores PKCE parameters in session storage
 * @param codeVerifier - The code verifier to store
 * @param state - The OAuth state to store
 */
export function storePKCEParams(codeVerifier: string, state: string): void {
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);
}

/**
 * Retrieves PKCE parameters from session storage
 * @returns {object} Object containing codeVerifier and state
 */
export function getPKCEParams(): { codeVerifier: string | null; state: string | null } {
  return {
    codeVerifier: sessionStorage.getItem('pkce_code_verifier'),
    state: sessionStorage.getItem('oauth_state')
  };
}

/**
 * Clears PKCE parameters from session storage
 */
export function clearPKCEParams(): void {
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('oauth_state');
}

/**
 * Validates the state parameter against stored state
 * @param state - The state returned from OAuth callback
 * @returns {boolean} True if state matches
 */
export function validateState(state: string): boolean {
  const storedState = sessionStorage.getItem('oauth_state');
  return storedState === state;
}
