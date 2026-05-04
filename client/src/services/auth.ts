/**
 * Consolidated OAuth Service
 * Single, consistent, and secure PKCE-based GitHub authentication
 */

import { initiateGitHubLogin } from '@/utils/oauth';
import { getPKCEParams, clearPKCEParams, validateState } from '@/utils/pkce';

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  username: string | null;
}

export class OAuthService {
  private static instance: OAuthService;
  private config: OAuthConfig | null = null;
  private state: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null,
    username: null,
  };

  private constructor() {
    // Singleton pattern
    if (OAuthService.instance) {
      return OAuthService.instance;
    }
    OAuthService.instance = this;
  }

  /**
   * Initialize OAuth service with configuration
   */
  public initialize(config: OAuthConfig): void {
    this.config = config;
    console.log('OAuth service initialized with config:', {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
    });
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
    console.log('Authentication state cleared');
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
      console.log('OAuth authentication successful:', {
        username: userData.login,
        token: data.access_token?.substring(0, 10) + '...',
      });

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
      
      // Login initiated successfully
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

  /**
   * Handle manual token input
   */
  public async handleTokenInput(token: string): Promise<void> {
    try {
      this.state = {
        ...this.state,
        isLoading: true,
        error: null,
      };

      // Validate token with GitHub API
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        this.state = {
          ...this.state,
          isLoading: false,
          error: 'Invalid token',
        };
        return;
      }

      const userData = await response.json();

      // Success - update state
      this.state = {
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: token,
        username: userData.login,
      };

      console.log('Token authentication successful:', {
        username: userData.login,
        token: token.substring(0, 10) + '...',
      });

    } catch (error) {
      this.state = {
        ...this.state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      };
      console.error('Token validation error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new OAuthService();
