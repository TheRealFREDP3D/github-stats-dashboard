import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Key, User } from "lucide-react";
import { useState } from "react";
import { OAuthLoginButton } from "@/components/OAuthLoginButton";

interface TokenInputProps {
  onSubmit: (token: string, username?: string) => void;
}

export default function TokenInput({ onSubmit }: TokenInputProps) {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [useToken, setUseToken] = useState(true);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTokenMode = useToken;
    const tokenValue = token.trim();
    const usernameValue = username.trim();
    const inputValue = isTokenMode ? tokenValue : usernameValue;

    if (inputValue) {
      setLoading(true);
      // Small delay to show loading state
      setTimeout(() => {
        if (isTokenMode) {
          onSubmit(tokenValue);
        } else {
          onSubmit("", usernameValue);
        }
        setLoading(false);
      }, 300);
    }
  };

  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg mb-4">
            <Github className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            GitHub Stats Dashboard
          </h1>
          <p className="text-muted-foreground">
            Quick overview of all your repositories in one place
          </p>
        </div>

        
        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {/* Toggle between token, username, and OAuth */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setUseToken(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                useToken
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Key className="w-4 h-4" />
              Access Token
            </button>
            <button
              type="button"
              onClick={() => setUseToken(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                !useToken
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              Username
            </button>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={useToken ? "token" : "username"}
              className="text-sm font-semibold text-foreground"
            >
              {useToken ? "Personal Access Token" : "GitHub Username"}
            </label>
            <div className="relative">
              {useToken ? (
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              ) : (
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                id={useToken ? "token" : "username"}
                type={useToken ? "password" : "text"}
                placeholder={useToken ? "ghp_xxxxxxxxxxxxxxxxxxxx" : "octocat"}
                value={useToken ? token : username}
                onChange={e =>
                  useToken
                    ? setToken(e.target.value)
                    : setUsername(e.target.value)
                }
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {useToken
                ? "Your token is stored locally and never sent to any server except GitHub API."
                : "Fetch public repository information without requiring an access token."}
            </p>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : useToken
                ? "Load Repositories"
                : "Fetch Public Repos"}
          </Button>
        </form>

        {/* OAuth Login Section */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <div className="mt-4">
            <OAuthLoginButton 
              onLoginStart={() => setLoading(true)}
              onLoginError={(error) => {
                setLoading(false);
                // OAuthLoginButton already displays the error
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            {useToken
              ? "How to get a Personal Access Token:"
              : "Using Username Mode:"}
          </h3>
          {useToken ? (
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
              <li>
                Go to GitHub Settings → Developer settings → Personal access
                tokens
              </li>
              <li>Click "Generate new token (classic)"</li>
              <li>
                Select scopes:{" "}
                <code className="bg-slate-100 px-1 rounded text-slate-700">
                  repo
                </code>{" "}
                (for private repos) or{" "}
                <code className="bg-slate-100 px-1 rounded text-slate-700">
                  public_repo
                </code>
              </li>
              <li>Copy the generated token and paste it above</li>
            </ol>
          ) : (
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                • Simply enter any GitHub username to view their public
                repositories
              </p>
              <p>• No authentication required</p>
              <p>• Limited to public repository information only</p>
              <p>
                • Traffic data and private stats are not available in this mode
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
