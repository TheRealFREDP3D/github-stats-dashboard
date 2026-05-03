import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useState } from "react";
import { ThemeSelector } from "@/components/ThemeSelector";
import Dashboard from "./pages/Dashboard";
import TokenInput from "./pages/TokenInput";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getPKCEParams, clearPKCEParams, validateState } from "./utils/pkce";

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
      const pkceParams = getPKCEParams();
      
      if (!pkceParams.codeVerifier || !validateState(state)) {
        toast.error('Invalid OAuth state. Please try logging in again.');
        clearPKCEParams();
        return;
      }

      // Exchange authorization code for access token
      fetch('/api/auth/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          code_verifier: pkceParams.codeVerifier,
          state: state,
        }),
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => {
              throw new Error(err.error || 'Token exchange failed');
            });
          }
          return response.json();
        })
        .then(data => {
          if (data.access_token) {
            // Validate the token by making a test API call
            return fetch('https://api.github.com/user', {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
                Accept: 'application/vnd.github.v3+json'
              }
            }).then(apiResponse => {
              if (apiResponse.ok) {
                // Set the token and notify user
                setToken(data.access_token);
                toast.success('Successfully authenticated with GitHub!');
                clearPKCEParams();
                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
              } else {
                console.error('[OAuth] Token validation failed:', apiResponse.status);
                toast.error('GitHub authentication failed. Token is invalid.');
                clearPKCEParams();
              }
            });
          } else {
            throw new Error('No access token received');
          }
        })
        .catch(error => {
          console.error('[OAuth] Token exchange error:', error);
          toast.error(`GitHub authentication failed: ${error.message}`);
          clearPKCEParams();
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
            <TokenInput onSubmit={handleTokenSubmit} />
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-lg mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-600 mb-6">
              An unexpected error occurred while loading the application.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
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
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-slate-100 rounded text-xs text-slate-700 overflow-auto max-h-32">
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
