import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
// TokenInput component removed - OAuth consolidated
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { handleOAuthCallback } from "./utils/auth-consolidated";

function App() {
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");

// Handle PKCE OAuth callback from GitHub
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.substring(1) || window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // Handle PKCE callback - exchange code for token
      handleOAuthCallback(urlParams)
        .then(({ token, username }) => {
          setToken(token);
          setUsername(username);
          toast.success('Successfully authenticated with GitHub!');
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(error => {
          console.error('[OAuth] OAuth callback error:', error);
          toast.error(`GitHub authentication failed: ${error.message}`);
        });
    }
  }, []);

  const handleTokenSubmit = (
    submittedToken: string,
    submittedUsername?: string
  ) => {
    setToken(submittedToken);
    setUsername(submittedUsername || "");
  };

  const handleLogout = () => {
    setToken("");
    setUsername("");
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          {!(token || username) ? (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
              <div className="max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-foreground mb-4">
                  GitHub Stats Dashboard
                </h1>
                <p className="text-muted-foreground mb-6">
                  OAuth authentication is being consolidated. Please use a token or username for now.
                </p>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter GitHub token"
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                    onChange={(e) => handleTokenSubmit(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Enter GitHub username"
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                    onChange={(e) => handleTokenSubmit("", e.target.value)}
                  />
                </div>
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
