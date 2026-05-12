import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Key, Shield, Loader2 } from "lucide-react";
import { env } from "@/lib/env";

type DevAuthPanelProps = {
  devToken: string;
  devAuthError: string;
  isLoading: boolean;
  onChangeToken: (v: string) => void;
  onAuthenticate: () => void;
};

export function DevAuthPanel({
  devToken,
  devAuthError,
  isLoading,
  onChangeToken,
  onAuthenticate,
}: DevAuthPanelProps) {
  if (!env.DEVELOPMENT) return null;

  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="font-medium text-blue-900 dark:text-blue-100">
          Development Mode
        </h3>
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
            onChange={(e) => onChangeToken(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={onAuthenticate}
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
}
