/**
 * OAuth Service
 * Secure PKCE-based GitHub authentication for production
 */

import { initiateGitHubLogin } from '@/utils/auth-consolidated';
import { getPKCEParams, clearPKCEParams, validateState } from '@/utils/pkce';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  username: string | null;
}

export class OAuthService {
  private static instance: OAuthService;
  private state: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null,
    username: null,
  };

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  /**
   * Get current authentication state
   */
  public getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  /**
   * Get current token
   */
  public getToken(): string | null {
    return this.state.token;
  }

  /**
   * Get current username
   */
  public getUsername(): string | null {
    return this.state.username;
  }

  /**
   * Clear authentication state (logout)
   */
  public clearAuth(): void {
    this.state = {
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      username: null,
    };
    clearPKCEParams();
  }

  /**
   * Handle OAuth callback from GitHub redirect
   */
  public async handleOAuthCallback(urlParams: URLSearchParams): Promise<void> {
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (!code || !state) {
      this.state = {
        ...this.state,
        error: 'Invalid OAuth callback: missing code or state',
      };
      return;
    }

    try {
      this.state = {
        ...this.state,
        isLoading: true,
        error: null,
      };

      const pkceParams = getPKCEParams();
      
      if (!pkceParams.codeVerifier || !validateState(state)) {
        this.state = {
          ...this.state,
          isLoading: false,
          error: 'Invalid OAuth state or missing PKCE parameters',
        };
        return;
      }

      // Exchange authorization code for access token
      const response = await fetch('/api/auth/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          code_verifier: pkceParams.codeVerifier,
          state,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Token exchange failed';
        
        this.state = {
          ...this.state,
          isLoading: false,
          error: errorMessage,
        };
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.access_token) {
        this.state = {
          ...this.state,
          isLoading: false,
          error: 'No access token received',
        };
        return;
      }

      // Validate token with GitHub API
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        this.state = {
          ...this.state,
          isLoading: false,
          error: 'Token validation failed',
        };
        return;
      }

      const userData = await userResponse.json();

      // Success - update state
      this.state = {
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: data.access_token,
        username: userData.login,
      };

      clearPKCEParams();

    } catch (error) {
      this.state = {
        ...this.state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Initiate GitHub OAuth login
   */
  public async initiateLogin(): Promise<void> {
    try {
      this.state = {
        ...this.state,
        isLoading: true,
        error: null,
      };

      await initiateGitHubLogin();
      
      this.state = {
        ...this.state,
        isLoading: false,
      };

    } catch (error) {
      this.state = {
        ...this.state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
      console.error('Login initiation error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = OAuthService.getInstance();
