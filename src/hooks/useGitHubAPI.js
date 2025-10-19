import { useState, useEffect } from 'react';

const GITHUB_API_BASE = 'https://api.github.com';

export const useGitHubAPI = (token) => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWithAuth = async (url) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's repositories
      const repos = await fetchWithAuth(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100`);

      // Fetch additional stats for each repository
      const reposWithStats = await Promise.all(
        repos.map(async (repo) => {
          try {
            // Fetch traffic data (views and clones)
            const [views, clones, pulls, issues] = await Promise.all([
              fetchWithAuth(`${GITHUB_API_BASE}/repos/${repo.owner.login}/${repo.name}/traffic/views`).catch(() => ({ count: 0, uniques: 0 })),
              fetchWithAuth(`${GITHUB_API_BASE}/repos/${repo.owner.login}/${repo.name}/traffic/clones`).catch(() => ({ count: 0, uniques: 0 })),
              fetchWithAuth(`${GITHUB_API_BASE}/repos/${repo.owner.login}/${repo.name}/pulls?state=all&per_page=1`).catch(() => []),
              fetchWithAuth(`${GITHUB_API_BASE}/repos/${repo.owner.login}/${repo.name}/issues?state=all&per_page=1`).catch(() => []),
            ]);

            // Get counts from headers if available
            const pullsResponse = await fetch(`${GITHUB_API_BASE}/repos/${repo.owner.login}/${repo.name}/pulls?state=all&per_page=1`, {
              headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            });

            const issuesResponse = await fetch(`${GITHUB_API_BASE}/repos/${repo.owner.login}/${repo.name}/issues?state=all&per_page=1`, {
              headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            });

            // Parse Link header to get total count
            const parseLinkHeader = (header) => {
              if (!header) return 0;
              const match = header.match(/page=(\d+)>; rel="last"/);
              return match ? parseInt(match[1], 10) : 1;
            };

            const pullsCount = parseLinkHeader(pullsResponse.headers.get('Link')) || pulls.length;
            const issuesCount = parseLinkHeader(issuesResponse.headers.get('Link')) || issues.length;

            return {
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
              defaultBranch: repo.default_branch,
              // Social image (OpenGraph image)
              socialImage: `https://opengraph.githubassets.com/1/${repo.full_name}`,
              // Traffic stats
              views: views.count || 0,
              uniqueViews: views.uniques || 0,
              clones: clones.count || 0,
              uniqueClones: clones.uniques || 0,
              // PR and Issue counts
              totalPulls: pullsCount,
              totalIssues: issuesCount,
              // Additional data for detail view
              viewsData: views.views || [],
              clonesData: clones.clones || [],
            };
          } catch (err) {
            console.error(`Error fetching stats for ${repo.name}:`, err);
            return {
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
              defaultBranch: repo.default_branch || 'main',
              socialImage: `https://opengraph.githubassets.com/1/${repo.full_name}`,
              views: 0,
              uniqueViews: 0,
              clones: 0,
              uniqueClones: 0,
              totalPulls: 0,
              totalIssues: 0,
              viewsData: [],
              clonesData: [],
            };
          }
        })
      );

      setRepositories(reposWithStats);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRepositories();
    }
  }, [token]);

  return { repositories, loading, error, refetch: fetchRepositories };
};
