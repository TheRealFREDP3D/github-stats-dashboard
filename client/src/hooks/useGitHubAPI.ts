import { useEffect, useState } from "react";
import { ErrorCode, createGitHubError, getErrorCodeFromStatus, GitHubError } from "@/errors";
import { apiCache, cachedFetch, CacheKeys, CacheTTL } from "@/utils/api-cache";

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  owner: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  updatedAt: string;
  createdAt: string;
  defaultBranch: string;
  socialImage: string;
  // Detailed stats - loaded lazily
  views?: number;
  uniqueViews?: number;
  clones?: number;
  uniqueClones?: number;
  totalPulls?: number;
  totalIssues?: number;
  viewsData?: Array<{ date: string; count: number; uniques: number }>;
  clonesData?: Array<{ date: string; count: number; uniques: number }>;
  // Flag to indicate if traffic data is unavailable due to permissions
  trafficDataUnavailable?: boolean;
}

interface UseGitHubAPIReturn {
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  errorCode: ErrorCode | null;
  refetch: () => Promise<void>;
  fetchDetailedStats: (repo: Repository) => Promise<Repository>;
}

const GITHUB_API_BASE = "https://api.github.com";

// Simple concurrency limiter
class ConcurrencyLimiter {
  private running = 0;
  private queue: (() => void)[] = [];

  constructor(private limit: number = 5) {}

  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        this.running++;
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      if (this.running < this.limit) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.limit) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const statsLimiter = new ConcurrencyLimiter(5);
const statsCache = new Map<string, Repository>();

type TrafficViews = { count: number; uniques: number; views: any[] };
type TrafficClones = { count: number; uniques: number; clones: any[] };

const validateUsername = (username: string): boolean => {
  // GitHub usernames: 1-39 characters, alphanumeric and hyphens
  // Cannot start or end with hyphen
  const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  return usernameRegex.test(username);
};

const buildReposUrl = (token?: string, username?: string): string => {
  if (username) {
    const trimmedUsername = username.trim();

    // Validate username format
    if (!validateUsername(trimmedUsername)) {
      throw createGitHubError(ErrorCode.INVALID_USERNAME_FORMAT);
    }

    // Encode username for safe URL construction
    const safeUsername = encodeURIComponent(trimmedUsername);
    return `${GITHUB_API_BASE}/users/${safeUsername}/repos?sort=updated&per_page=100`;
  }
  if (token) {
    return `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100`;
  }
  throw new Error("Either token or username is required");
};

const buildHeaders = (token?: string): Record<string, string> => ({
  Accept: "application/vnd.github.v3+json",
  ...(token ? { Authorization: `token ${token}` } : {}),
});

export function useGitHubAPI(
  token: string,
  username?: string
): UseGitHubAPIReturn {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const fetchWithAuth = async (url: string, cacheKey?: string, ttl?: number) => {
    const response = await cachedFetch(url, { headers: buildHeaders(token) }, cacheKey, ttl);
    if (!response.ok) {
      console.error(`[GitHub API] Error fetching ${url}:`, response.status, response.statusText);
      const errorCode = getErrorCodeFromStatus(response.status, !!token);
      const error = createGitHubError(errorCode, response.status);
      throw error;
    }
    return response.json();
  };

  const fetchResponseWithOptionalAuth = async (
    url: string
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, { 
        headers: buildHeaders(token),
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Log warning but don't throw - we'll handle fallbacks
        console.warn(
          `GitHub API warning: ${response.status} ${response.statusText} for ${url}`
        );
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[GitHub API] Request timeout for ${url}`);
        throw createGitHubError(ErrorCode.NETWORK_ERROR, 408);
      }
      
      throw error;
    }
  };

  const fetchCountWithFallback = async (url: string): Promise<number> => {
    try {
      const response = await fetchResponseWithOptionalAuth(url);
      if (!response.ok) {
        return 0;
      }

      const linkHeader = response.headers.get("Link");
      if (!linkHeader) {
        return 0;
      }

      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      return match ? parseInt(match[1], 10) : 0;
    } catch (error) {
      // Network errors or other issues
      console.warn(`Failed to fetch count for ${url}:`, error);
      return 0;
    }
  };

  const fetchDetailedStats = async (repo: Repository): Promise<Repository> => {
    const cacheKey = CacheKeys.repoStats(repo.owner, repo.name);

    // Check cache first
    const cached = apiCache.get<Repository>(cacheKey);
    if (cached) {
      console.log(`[GitHub API] Using cached stats for ${repo.owner}/${repo.name}`);
      // Update the repository in the main list with cached data
      setRepositories(prevRepos => 
        prevRepos.map(r => 
          r.id === repo.id ? { ...r, ...cached } : r
        )
      );
      return cached;
    }

    return statsLimiter.execute(async () => {
      try {
        // Skip expensive stats for public mode (no token)
        if (!token) {
          return repo;
        }

        const { views, clones, unavailable } = await getTrafficStats(repo, token);

        // Fetch pull requests and issues counts with proper error handling
        const [pullsCount, issuesCount] = await Promise.all([
          fetchCountWithFallback(
            `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/pulls?state=all&per_page=1`
          ),
          fetchCountWithFallback(
            `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/issues?state=all&per_page=1`
          ),
        ]);

        // Format traffic data for charts
        const formatTrafficData = (data: any[]) => {
          return data.map((item: any) => ({
            date: item.timestamp.split("T")[0],
            count: item.count,
            uniques: item.uniques,
          }));
        };

        const detailedRepo: Repository = {
          ...repo,
          views: views.count || 0,
          uniqueViews: views.uniques || 0,
          clones: clones.count || 0,
          uniqueClones: clones.uniques || 0,
          totalPulls: pullsCount,
          totalIssues: issuesCount,
          viewsData: formatTrafficData(views.views || []),
          clonesData: formatTrafficData(clones.clones || []),
          trafficDataUnavailable: unavailable,
        };

        // Cache the result with longer TTL for stats
        apiCache.set(cacheKey, detailedRepo, CacheTTL.REPO_STATS);

        // Update the repository in the main list
        setRepositories(prevRepos => 
          prevRepos.map(r => 
            r.id === repo.id ? { ...r, ...detailedRepo } : r
          )
        );

        return detailedRepo;
      } catch (error) {
        console.error(`Error fetching detailed stats for ${repo.name}:`, error);
        return repo;
      }
    });
  };

  const getTrafficStats = async (
    repo: any,
    token?: string
  ): Promise<{ views: TrafficViews; clones: TrafficClones; unavailable: boolean }> => {
    const defaultViews = { count: 0, uniques: 0, views: [] };
    const defaultClones = { count: 0, uniques: 0, clones: [] };

    if (!token) {
      return { views: defaultViews, clones: defaultClones, unavailable: true };
    }

    let viewsUnavailable = false;
    let clonesUnavailable = false;

    const viewsCacheKey = CacheKeys.repoTraffic(repo.owner, repo.name, 'views');
    const clonesCacheKey = CacheKeys.repoTraffic(repo.owner, repo.name, 'clones');

    const [views, clones] = await Promise.all([
      // Use cached fetch for traffic data with longer TTL
      fetchWithAuth(
        `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/traffic/views`,
        viewsCacheKey,
        CacheTTL.TRAFFIC_DATA
      )
        .then(data => data)
        .catch((error) => {
          console.error(`[Traffic Stats] Failed to fetch views for ${repo.owner}/${repo.name}:`, error);
          viewsUnavailable = true;
          return defaultViews;
        }),
      fetchWithAuth(
        `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/traffic/clones`,
        clonesCacheKey,
        CacheTTL.TRAFFIC_DATA
      )
        .then(data => data)
        .catch((error) => {
          console.error(`[Traffic Stats] Failed to fetch clones for ${repo.owner}/${repo.name}:`, error);
          clonesUnavailable = true;
          return defaultClones;
        }),
    ]);

    return { views, clones, unavailable: viewsUnavailable || clonesUnavailable };
  };

  const fetchAllDetailedStats = async (repos: Repository[]): Promise<Repository[]> => {
    // Skip expensive stats for public mode (no token)
    if (!token) {
      return repos;
    }

    // Fetch detailed stats for all repositories with concurrency control
    const updatedRepos = await Promise.all(
      repos.map(repo => fetchDetailedStats(repo))
    );

    return updatedRepos;
  };

  const fetchRepositories = async () => {
    if (!token && !username) {
      setError("Either token or username is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reposUrl = buildReposUrl(token, username);
      const cacheKey = username ? CacheKeys.userRepos(username) : `repos:token:${token.slice(-8)}`;
      const repos = await fetchWithAuth(reposUrl, cacheKey, CacheTTL.REPO_BASIC);

      // Return basic repository data without expensive stats
      const basicRepos: Repository[] = repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        owner: repo.owner.login,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        language: repo.language,
        updatedAt: repo.updated_at,
        createdAt: repo.created_at,
        defaultBranch: repo.default_branch || "main",
        socialImage: `https://opengraph.githubassets.com/1/${repo.full_name}`,
        // Detailed stats are undefined until loaded
      }));

      setRepositories(basicRepos);

      // Fetch detailed stats for all repositories if token is available
      if (token) {
        try {
          const reposWithStats = await fetchAllDetailedStats(basicRepos);
          setRepositories(reposWithStats);
        } catch (statsError) {
          console.warn("Failed to fetch detailed stats for all repositories:", statsError);
          // Keep basic repos if detailed stats fail
        }
      }
    } catch (err) {
      let errorMessage = "Failed to fetch repositories";
      let errCode: ErrorCode | null = null;

      if (err instanceof Error && 'code' in err) {
        // It's a structured GitHubError
        const githubError = err as GitHubError;
        errorMessage = githubError.message;
        errCode = githubError.code;
      } else if (err instanceof Error) {
        errorMessage = err.message;
        errCode = ErrorCode.UNKNOWN_ERROR;
      }

      setError(errorMessage);
      setErrorCode(errCode);
      console.error("Error fetching repositories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token || username) {
      fetchRepositories();
    }
  }, [token, username]);

  return {
    repositories,
    loading,
    error,
    errorCode,
    refetch: fetchRepositories,
    fetchDetailedStats,
  };
}
