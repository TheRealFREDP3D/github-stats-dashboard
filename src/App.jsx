import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { LLMProvider } from "@/contexts/LLMContext.jsx";
import { Github, Key } from "lucide-react";
import { useState } from "react";
import "./App.css";
import { Dashboard } from "./components/Dashboard";
import { useGitHubAPI } from "./hooks/useGitHubAPI";

function App() {
  const [token, setToken] = useState("");
  const [submittedToken, setSubmittedToken] = useState("");
  const { repositories, loading, error } = useGitHubAPI(submittedToken);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      setSubmittedToken(token.trim());
    }
  };

  return (
    <LLMProvider>
      {!submittedToken ? (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Github className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                GitHub Stats Dashboard
              </h1>
              <p className="text-muted-foreground">
                Enter your GitHub Personal Access Token to view your repository
                statistics
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="token"
                  className="text-sm font-medium text-foreground"
                >
                  Personal Access Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your token is stored locally and never sent to any server
                  except GitHub API.
                </p>
              </div>

              <Button type="submit" className="w-full">
                Load Repositories
              </Button>
            </form>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                How to get a Personal Access Token:
              </h3>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Go to GitHub Settings → Developer settings → Personal access
                  tokens
                </li>
                <li>Click "Generate new token (classic)"</li>
                <li>
                  Select scopes:{" "}
                  <code className="bg-muted px-1 rounded">repo</code> (for
                  private repos) or{" "}
                  <code className="bg-muted px-1 rounded">public_repo</code>
                </li>
                <li>Copy the generated token and paste it above</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <Dashboard
          repositories={repositories}
          loading={loading}
          error={error}
        />
      )}
    </LLMProvider>
  );
}

export default App;
