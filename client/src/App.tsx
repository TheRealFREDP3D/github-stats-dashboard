import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Github, Loader2, Key, Shield } from "lucide-react";
import { toast } from "sonner";
import { handleOAuthCallback, initiateGitHubLogin } from "./utils/auth-consolidated";
import { 
  authenticateWithToken, 
  attemptDevAuth, 
  isValidTokenFormat, 
  storeDevToken, 
  getStoredDevToken, 
  clearDevToken,
  isDevModeAvailable 
} from "./utils/dev-auth";
import { env } from "./lib/env";

function App() {
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState<boolean>(false);
  const [devToken, setDevToken] = useState<string>("");
  const [devAuthError, setDevAuthError] = useState<string>("");
  const [useDevMode, setUseDevMode] = useState<boolean>(false);

  // Handle PKCE OAuth callback from GitHub
  useEffect(() => {
    // Skip OAuth callback handling in development mode
    if (useDevMode) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      setIsProcessingCallback(true);
      handleOAuthCallback(urlParams)
        .then(({ token, username }) => {
          setToken(token);
          setUsername(username);
          toast.success('Successfully authenticated with GitHub!');
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(error => {
          console.error('[OAuth] OAuth callback error:', error);
          toast.error(`GitHub authentication failed: ${error.message}`);
        })
        .finally(() => {
          setIsProcessingCallback(false);
        });
    }
  }, [useDevMode]);

  // Attempt development mode authentication on mount
  useEffect(() => {
    if (env.DEVELOPMENT && isDevModeAvailable()) {
      attemptDevAuth().then(result => {
        if (result.isAuthenticated && result.token && result.username) {
          setToken(result.token);
          setUsername(result.username);
          setUseDevMode(true);
          toast.success('Authenticated using development token!');
        }
      });
    } else if (env.DEVELOPMENT) {
      // Check for stored token in session
      const storedToken = getStoredDevToken();
      if (storedToken) {
        setDevToken(storedToken);
      }
    }
  }, []);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    try {
      await initiateGitHubLogin();
    } catch (error) {
      console.error('[OAuth] Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate GitHub login');
      setIsLoading(false);
    }
  };

  const handleDevTokenAuth = async () => {
    if (!devToken.trim()) {
      setDevAuthError('Please enter a token');
      return;
    }

    if (!isValidTokenFormat(devToken)) {
      setDevAuthError('Invalid token format. GitHub Personal Access Tokens are typically 40+ characters long.');
      return;
    }

    setIsLoading(true);
    setDevAuthError('');

    try {
      const result = await authenticateWithToken(devToken);
      
      if (result.isAuthenticated && result.token && result.username) {
        setToken(result.token);
        setUsername(result.username);
        setUseDevMode(true);
        storeDevToken(devToken);
        toast.success('Successfully authenticated with Personal Access Token!');
      } else {
        setDevAuthError(result.error || 'Authentication failed');
      }
    } catch (error) {
      setDevAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUsername("");
    setDevToken("");
    setDevAuthError("");
    setUseDevMode(false);
    clearDevToken();
  };

  // Render development mode UI
  const renderDevAuth = () => {
    if (!env.DEVELOPMENT) {
      return null;
    }

    return (
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-blue-900 dark:text-blue-100">Development Mode</h3>
        </div>
        
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          Use a GitHub Personal Access Token instead of OAuth for development.
        </p>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter GitHub Personal Access Token"
              value={devToken}
              onChange={(e) => {
                setDevToken(e.target.value);
                setDevAuthError('');
              }}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleDevTokenAuth}
              disabled={isLoading || !devToken.trim()}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
            </Button>
          </div>

          {devAuthError && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                {devAuthError}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="mb-1">Create a token at: </p>
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              github.com/settings/tokens
            </a>
            <p className="mt-1">Required scopes: public_repo, read:user</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          {!(token || username) ? (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
              <div className="max-w-md w-full text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Github className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    GitHub Stats Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    View and analyze your GitHub repository statistics
                  </p>
                </div>

                {renderDevAuth()}

                {isProcessingCallback ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Completing authentication...</p>
                  </div>
                ) : (
                  <Button
                    onClick={handleGitHubLogin}
                    disabled={isLoading}
                    className="w-full bg-[#24292f] hover:bg-[#24292f]/90 text-white py-6 text-lg font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Redirecting to GitHub...
                      </>
                    ) : (
                      <>
                        <Github className="w-5 h-5 mr-2" />
                        Sign in with GitHub
                      </>
                    )}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground mt-6">
                  {env.DEVELOPMENT 
                    ? "Development Mode: Use Personal Access Token authentication above or OAuth below"
                    : "Secure authentication via GitHub OAuth with PKCE"
                  }
                </p>
              </div>
            </div>
          ) : (
            <Dashboard
              token={token}
              username={username}
              onLogout={handleLogout}
            />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-lg mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred while loading the application.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-muted rounded text-xs text-muted-foreground overflow-auto max-h-32">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
