import { useEffect, useState } from "react";
import {
  authenticateWithToken,
  attemptDevAuth,
  isValidTokenFormat,
  storeDevToken,
  getStoredDevToken,
  clearDevToken,
  isDevModeAvailable,
} from "@/utils/dev-auth";
import { toast } from "sonner";
import { env } from "@/lib/env";

export function useDevAuth(onAuth: (token: string, username: string) => void) {
  const [devToken, setDevToken] = useState("");
  const [devAuthError, setDevAuthError] = useState("");
  const [devModeActive, setDevModeActive] = useState(false);
  const [isLoadingDev, setIsLoadingDev] = useState(false);

  useEffect(() => {
    if (!env.DEVELOPMENT) return;

    if (isDevModeAvailable()) {
      attemptDevAuth().then((result) => {
        if (result.isAuthenticated && result.token && result.username) {
          onAuth(result.token, result.username);
          setDevModeActive(true);
          toast.success("Authenticated using development token!");
        }
      });
    } else {
      const storedToken = getStoredDevToken();
      if (storedToken) {
        setDevToken(storedToken);
      }
    }
  }, [onAuth]);

  const authenticateDevToken = async () => {
    if (!devToken.trim()) {
      setDevAuthError("Please enter a token");
      return;
    }
    if (!isValidTokenFormat(devToken)) {
      setDevAuthError(
        "Invalid token format. GitHub Personal Access Tokens are typically 40+ characters long."
      );
      return;
    }

    setIsLoadingDev(true);
    setDevAuthError("");

    try {
      const result = await authenticateWithToken(devToken);
      if (result.isAuthenticated && result.token && result.username) {
        onAuth(result.token, result.username);
        setDevModeActive(true);
        storeDevToken(devToken);
        toast.success("Successfully authenticated with Personal Access Token!");
      } else {
        setDevAuthError(result.error || "Authentication failed");
      }
    } catch (error) {
      setDevAuthError(
        error instanceof Error ? error.message : "Authentication failed"
      );
    } finally {
      setIsLoadingDev(false);
    }
  };

  const resetDevAuth = () => {
    setDevToken("");
    setDevAuthError("");
    setDevModeActive(false);
    clearDevToken();
  };

  const clearDevAuthError = () => {
    setDevAuthError("");
  };

  return {
    devModeActive,
    devToken,
    devAuthError,
    isLoadingDev,
    setDevToken,
    authenticateDevToken,
    resetDevAuth,
    clearDevAuthError,
  };
}
