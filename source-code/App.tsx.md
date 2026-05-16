# App.tsx - Main Application Component

```typescript
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Github, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { handleOAuthCallback, initiateGitHubLogin } from "./utils/auth-consolidated";
import { DevAuthPanel } from "@/components/DevAuthPanel";
import { useDevAuth } from "@/hooks/useDevAuth";
import { env } from "./lib/env";

function App() {
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState<boolean>(false);

  const {
    devModeActive,
    devToken,
    devAuthError,
    isLoadingDev,
    setDevToken,
    authenticateDevToken,
    resetDevAuth,
    clearDevAuthError,
  } = useDevAuth((t, u) => {
    setToken(t);
    setUsername(u);
  });

  // Handle PKCE OAuth callback from GitHub
  useEffect(() => {
    // Skip OAuth callback handling if already authenticated
    if (devModeActive || token || username) {
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
  }, [devModeActive, token, username]);


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


  const handleLogout = () => {
    setToken("");
    setUsername("");
    resetDevAuth();
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

                <DevAuthPanel
                  devToken={devToken}
                  devAuthError={devAuthError}
                  isLoading={isLoadingDev}
                  onChangeToken={(v) => {
                    setDevToken(v);
                    clearDevAuthError();
                  }}
                  onAuthenticate={authenticateDevToken}
                />

                {isProcessingCallback ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Completing authentication...</p>
                  </div>
                ) : (
                  !env.DEVELOPMENT && (
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
                  )
                )}

                <p className="text-xs text-muted-foreground mt-6">
                  {env.DEVELOPMENT
                    ? "Development Mode: Use Personal Access Token authentication above"
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

            {env.DEVELOPMENT && this.state.error && (
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
```

## Key Features

- **Authentication Management**: Handles multiple auth methods (PAT, OAuth, dev mode)
- **Error Boundary**: Comprehensive error handling with development details
- **Theme Support**: Integrated with ThemeProvider for light/dark mode
- **OAuth Callback Processing**: Handles GitHub OAuth PKCE flow
- **Responsive Design**: Mobile-first responsive layout
- **Loading States**: Proper loading indicators for async operations
