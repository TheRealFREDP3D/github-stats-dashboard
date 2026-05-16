# API Cache Utility - Intelligent Caching and Rate Limiting

```typescript
/**
 * API Caching and Rate Limiting Utilities
 * Provides intelligent caching and rate limiting for GitHub API calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private rateLimits = new Map<string, RateLimitInfo>();
  private pendingRequests = new Map<string, Promise<any>>();

  // Default TTL values for different types of data
  private static readonly TTL = {
    REPO_BASIC: 5 * 60 * 1000, // 5 minutes - basic repo info
    REPO_STATS: 15 * 60 * 1000, // 15 minutes - detailed stats
    TRAFFIC_DATA: 30 * 60 * 1000, // 30 minutes - traffic data (has strict limits)
    USER_INFO: 10 * 60 * 1000, // 10 minutes - user info
  };

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = APICache.TTL.REPO_BASIC): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Execute a request with caching and deduplication
   */
  async execute<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = APICache.TTL.REPO_BASIC
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached) {
      console.log(`[API Cache] Cache hit for ${key}`);
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`[API Cache] Request deduplicated for ${key}`);
      return pending;
    }

    // Execute request
    const promise = fetcher().then(data => {
      this.set(key, data, ttl);
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Update rate limit info from response headers
   */
  updateRateLimitInfo(url: string, headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const limit = headers.get('x-ratelimit-limit');

    if (remaining && reset && limit) {
      this.rateLimits.set(url, {
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10) * 1000, // Convert to milliseconds
        limit: parseInt(limit, 10),
      });
    }
  }

  /**
   * Check if we should delay a request based on rate limits
   */
  shouldDelayRequest(url: string): { delay: number; shouldDelay: boolean } {
    const rateLimit = this.rateLimits.get(url);
    if (!rateLimit) return { delay: 0, shouldDelay: false };

    const now = Date.now();
    const timeUntilReset = rateLimit.reset - now;

    // If we're running low on requests and reset is soon, delay
    if (rateLimit.remaining < 10 && timeUntilReset > 0 && timeUntilReset < 60000) {
      return { delay: Math.min(timeUntilReset, 5000), shouldDelay: true };
    }

    return { delay: 0, shouldDelay: false };
  }

  /**
   * Clear cache entries matching a pattern
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; pending: number; rateLimits: number } {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
      rateLimits: this.rateLimits.size,
    };
  }
}

// Global cache instance
export const apiCache = new APICache();

/**
 * Enhanced fetch with caching and rate limiting
 */
export async function cachedFetch(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  ttl?: number
): Promise<Response> {
  const key = cacheKey || url;
  
  // Check if we should delay the request
  const { delay, shouldDelay } = apiCache.shouldDelayRequest(url);
  if (shouldDelay) {
    console.log(`[API Cache] Rate limiting detected, delaying ${url} by ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Use cache for GET requests
  if (!options.method || options.method === 'GET') {
    try {
      const cachedResponse = apiCache.get<{ response: any; headers: Record<string, string> }>(key);
      if (cachedResponse) {
        return new Response(JSON.stringify(cachedResponse.response), {
          status: 200,
          headers: cachedResponse.headers,
        });
      }
    } catch (error) {
      console.warn('[API Cache] Failed to read cached response:', error);
    }
  }

  // Execute request
  const response = await fetch(url, options);

  // Update rate limit info
  apiCache.updateRateLimitInfo(url, response.headers);

  // Cache successful GET responses
  if (response.ok && (!options.method || options.method === 'GET')) {
    try {
      const responseData = await response.clone().json();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      apiCache.set(key, {
        response: responseData,
        headers,
      }, ttl);
    } catch (error) {
      console.warn('[API Cache] Failed to cache response:', error);
    }
  }

  return response;
}

/**
 * Cache key generators for different API endpoints
 */
export const CacheKeys = {
  repoBasic: (owner: string, repo: string) => `repo:${owner}/${repo}:basic`,
  repoStats: (owner: string, repo: string) => `repo:${owner}/${repo}:stats`,
  repoTraffic: (owner: string, repo: string, type: 'views' | 'clones') => `repo:${owner}/${repo}:traffic:${type}`,
  userRepos: (username: string) => `user:${username}:repos`,
  userInfo: (username: string) => `user:${username}:info`,
};

/**
 * TTL constants for different data types
 */
export const CacheTTL = {
  REPO_BASIC: 5 * 60 * 1000, // 5 minutes
  REPO_STATS: 15 * 60 * 1000, // 15 minutes
  TRAFFIC_DATA: 30 * 60 * 1000, // 30 minutes
  USER_INFO: 10 * 60 * 1000, // 10 minutes
};
```

## Key Features

- **Intelligent Caching**: Different TTL values for different data types
- **Rate Limiting**: Automatic delay when approaching GitHub API limits
- **Request Deduplication**: Prevents duplicate concurrent requests
- **Cache Statistics**: Monitor cache performance and usage
- **Flexible Cache Keys**: Standardized key generation for different endpoints
- **Enhanced Fetch**: Drop-in replacement for fetch with caching capabilities

## Usage Examples

```typescript
// Basic caching
const data = await apiCache.execute('user:fred:repos', () => 
  fetchUserRepos('fred')
);

// Using cachedFetch
const response = await cachedFetch(
  'https://api.github.com/user/repos',
  {},
  CacheKeys.userRepos('fred'),
  CacheTTL.REPO_STATS
);
```
