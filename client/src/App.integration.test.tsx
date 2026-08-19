import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHandleOAuthCallback, mockInitiateGitHubLogin } = vi.hoisted(() => ({
  mockHandleOAuthCallback: vi.fn(),
  mockInitiateGitHubLogin: vi.fn(),
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("./contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("./utils/auth-consolidated", () => ({
  handleOAuthCallback: mockHandleOAuthCallback,
  initiateGitHubLogin: mockInitiateGitHubLogin,
}));

vi.mock("./pages/Dashboard", () => ({
  default: ({ username }: { username?: string }) => (
    <div data-testid="dashboard-loaded">Dashboard loaded for {username}</div>
  ),
}));

vi.mock("@/components/DevAuthPanel", () => ({
  DevAuthPanel: ({ onAuthenticate }: { onAuthenticate: () => void }) => (
    <button onClick={onAuthenticate}>Use development auth</button>
  ),
}));

vi.mock("@/hooks/useDevAuth", () => ({
  useDevAuth: (onAuth: (token: string, username: string) => void) => ({
    devModeActive: false,
    devToken: "",
    devAuthError: null,
    isLoadingDev: false,
    setDevToken: vi.fn(),
    authenticateDevToken: () => onAuth("test-token", "octocat"),
    resetDevAuth: vi.fn(),
    clearDevAuthError: vi.fn(),
  }),
}));

import App from "./App";

describe("App async authentication flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockHandleOAuthCallback.mockReset();
    mockInitiateGitHubLogin.mockReset();
    window.history.replaceState({}, "", "/");
  });

  it("renders the login surface before authentication", () => {
    render(<App />);

    expect(screen.getByText("GitHub Stats Dashboard")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use development auth" })
    ).toBeInTheDocument();
  });

  it("loads the dashboard asynchronously after development authentication", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Use development auth" })
    );

    expect(
      screen.queryByText("Completing authentication...")
    ).not.toBeInTheDocument();
    expect(await screen.findByTestId("dashboard-loaded")).toHaveTextContent(
      "Dashboard loaded for octocat"
    );
  });

  it("restores a persisted session and resolves the lazy dashboard", async () => {
    sessionStorage.setItem("quickhubpulse_token", "stored-token");
    sessionStorage.setItem("quickhubpulse_username", "stored-user");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-loaded")).toHaveTextContent(
        "Dashboard loaded for stored-user"
      );
    });
  });
});
