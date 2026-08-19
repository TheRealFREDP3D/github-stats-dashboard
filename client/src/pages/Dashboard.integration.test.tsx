import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Repository } from "@/hooks/useGitHubAPI";

const { mockUseGitHubAPI } = vi.hoisted(() => ({
  mockUseGitHubAPI: vi.fn(),
}));

vi.mock("@/hooks/useGitHubAPI", () => ({
  useGitHubAPI: mockUseGitHubAPI,
}));

vi.mock("@/components/RepositoryCard", () => ({
  RepositoryCard: ({
    repo,
    onClick,
  }: {
    repo: Repository;
    onClick: () => void;
  }) => <button onClick={onClick}>{repo.name}</button>,
}));

vi.mock("@/components/RepositoryDetail", () => ({
  RepositoryDetail: ({
    repo,
    onClose,
  }: {
    repo: Repository;
    onClose: () => void;
  }) => (
    <div role="dialog" aria-label={`${repo.name} details`}>
      <span>{repo.name} details</span>
      <button onClick={onClose}>Close details</button>
    </div>
  ),
}));

vi.mock("@/components/ThemeSelector", () => ({
  ThemeSelector: () => <button>Theme settings</button>,
}));

vi.mock("@/hooks/useKeyboardNavigation", () => ({
  useKeyboardNavigation: vi.fn(),
}));

vi.mock("@/hooks/useLocalStats", () => ({
  useLocalStats: () => ({
    saveStats: vi.fn(),
    loadStats: vi.fn(),
    loadLatestStats: vi.fn(),
    loading: false,
    error: null,
  }),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: () => <span>Recent Activity</span>,
}));

import Dashboard from "./Dashboard";

const repository: Repository = {
  id: 1,
  name: "quickhubpulse",
  fullName: "octocat/quickhubpulse",
  description: "Repository dashboard",
  url: "https://github.com/octocat/quickhubpulse",
  owner: "octocat",
  stars: 42,
  forks: 7,
  openIssues: 2,
  language: "TypeScript",
  updatedAt: "2026-08-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  defaultBranch: "main",
  socialImage: "https://example.com/image.png",
};

const defaultApiState = {
  repositories: [repository],
  loading: false,
  error: null,
  errorCode: null,
  refetch: vi.fn(),
  fetchDetailedStats: vi.fn(async (repo: Repository) => repo),
};

describe("Dashboard async and repository flows", () => {
  beforeEach(() => {
    mockUseGitHubAPI.mockReset();
    mockUseGitHubAPI.mockReturnValue(defaultApiState);
  });

  it("renders the loading skeleton while repositories are being fetched", () => {
    mockUseGitHubAPI.mockReturnValue({
      ...defaultApiState,
      repositories: [],
      loading: true,
    });

    const { container } = render(
      <Dashboard token="token" username="octocat" onLogout={vi.fn()} />
    );

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6);
  });

  it("renders a network error without showing repository cards", () => {
    mockUseGitHubAPI.mockReturnValue({
      ...defaultApiState,
      repositories: [],
      error: "GitHub is unavailable",
    });

    render(<Dashboard token="token" onLogout={vi.fn()} />);

    expect(screen.getByText("Error loading repositories")).toBeInTheDocument();
    expect(screen.getByText("GitHub is unavailable")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: repository.name })
    ).not.toBeInTheDocument();
  });

  it("filters repositories and resolves the lazy detail component on selection", async () => {
    render(<Dashboard token="token" username="octocat" onLogout={vi.fn()} />);

    expect(screen.getByText("quickhubpulse")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search repositories..."), {
      target: { value: "missing" },
    });
    expect(
      screen.getByText("No repositories found matching your search")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search repositories..."), {
      target: { value: "quick" },
    });
    fireEvent.click(screen.getByRole("button", { name: repository.name }));

    expect(
      await screen.findByRole("dialog", { name: "quickhubpulse details" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
