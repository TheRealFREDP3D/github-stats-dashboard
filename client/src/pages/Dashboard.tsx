import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RepositoryCard } from "@/components/RepositoryCard";
import { RepositoryDetail } from "@/components/RepositoryDetail";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useGitHubAPI, Repository } from "@/hooks/useGitHubAPI";
import { ErrorCode } from "@/errors";
import { useLocalStats } from "@/hooks/useLocalStats";
import { Github, LogOut, Search, Keyboard, Save } from "lucide-react";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

type SortOption = "stars" | "forks" | "recent" | "views";

interface DashboardProps {
  token: string;
  username?: string;
  onLogout: () => void;
}

export default function Dashboard({
  token,
  username,
  onLogout,
}: DashboardProps) {
  const { repositories, loading, error, errorCode, refetch, fetchDetailedStats } =
    useGitHubAPI(token, username);
  const { saveStats } = useLocalStats();
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (repositories.length === 0) return;
    setSaving(true);
    try {
      await saveStats(repositories);
      toast.success("Stats saved locally");
    } catch {
      toast.error("Failed to save stats");
    } finally {
      setSaving(false);
    }
  };

  // Filter and sort repositories
  const filteredAndSortedRepositories = useMemo(() => {
    let filtered = repositories;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        repo =>
          repo.name.toLowerCase().includes(query) ||
          repo.description?.toLowerCase().includes(query)
      );
    }

    // Sort repositories
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return b.stars - a.stars;
        case "forks":
          return b.forks - a.forks;
        case "views":
          return (b.views || 0) - (a.views || 0);
        case "recent":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [repositories, searchQuery, sortBy]);

  // Setup keyboard navigation
  useKeyboardNavigation({
    itemCount: filteredAndSortedRepositories.length,
    currentIndex: focusedIndex,
    onIndexChange: newIndex => {
      setFocusedIndex(newIndex);
      // Scroll focused item into view
      setTimeout(() => {
        const element = document.querySelector(
          `[data-repo-index="${newIndex}"]`
        );
        element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    },
    onEnter: () => {
      if (focusedIndex >= 0 && filteredAndSortedRepositories[focusedIndex]) {
        setSelectedRepo(filteredAndSortedRepositories[focusedIndex]);
      }
    },
    onEscape: () => {
      setSelectedRepo(null);
      setFocusedIndex(-1);
    },
    enabled: !selectedRepo && filteredAndSortedRepositories.length > 0,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                GitHub Stats Dashboard
              </h1>
              {username && (
                <p className="text-xs text-slate-600">
                  Viewing public repositories for{" "}
                  <span className="font-medium">{username}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <Button
              variant="ghost"
              onClick={onLogout}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving || repositories.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Stats"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Public Data Notice */}
        {username && !loading && !error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0">
                ℹ️
              </div>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Public Access Mode</p>
                <p className="text-xs">
                  You're viewing public repository information only. Traffic
                  data (views/clones) and private repositories are not
                  accessible without authentication.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Hint */}
        {showKeyboardHint && filteredAndSortedRepositories.length > 0 && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start justify-between">
            <div className="flex items-start gap-2">
              <Keyboard className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">
                  Keyboard shortcuts available:
                </p>
                <p className="text-xs">
                  Arrow keys to navigate • Enter to open • Esc to close
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowKeyboardHint(false)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-4 flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search and Sort Bar */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="sort"
              className="text-sm font-medium text-slate-700"
            >
              Sort by:
            </label>
            <Select
              value={sortBy}
              onValueChange={value => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-48 bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent Activity</SelectItem>
                <SelectItem value="stars">Most Stars</SelectItem>
                <SelectItem value="forks">Most Forks</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-white rounded-lg p-5 border border-slate-200 animate-pulse"
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 bg-slate-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold mb-2">Error loading repositories</p>
            <div className="text-sm whitespace-pre-line">{error}</div>
            {(errorCode === ErrorCode.API_FORBIDDEN || errorCode === ErrorCode.API_RATE_LIMIT) && (
              <div className="mt-3 p-3 bg-red-100 rounded-md">
                <p className="text-xs font-medium mb-1">Quick fixes:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Wait a few minutes and try again (rate limit)</li>
                  <li>
                    Check your access token is valid and has correct permissions
                  </li>
                  <li>Try using a different GitHub username</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSortedRepositories.length === 0 && (
          <div className="text-center py-12">
            <Github className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">
              {searchQuery
                ? "No repositories found matching your search"
                : "No repositories found"}
            </p>
          </div>
        )}

        {/* Repositories Grid */}
        {!loading && !error && filteredAndSortedRepositories.length > 0 && (
          <>
            <div className="mb-4 text-sm text-slate-600">
              Showing {filteredAndSortedRepositories.length} of{" "}
              {repositories.length} repositories
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="wait">
                {filteredAndSortedRepositories.map((repo, index) => (
                  <RepositoryCard
                    key={repo.id}
                    repo={repo}
                    onClick={() => setSelectedRepo(repo)}
                    layoutId={`repo-${repo.id}`}
                    isFocused={focusedIndex === index}
                    onFocus={() => setFocusedIndex(index)}
                    data-repo-index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Repository Detail Modal */}
      <AnimatePresence>
        {selectedRepo && (
          <RepositoryDetail
            repo={selectedRepo}
            onClose={() => setSelectedRepo(null)}
            layoutId={`repo-${selectedRepo.id}`}
            fetchDetailedStats={fetchDetailedStats}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
