const GITHUB_API_BASE = 'https://api.github.com';

const fetchWithAuth = async (url, token) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    } else if (response.status === 404) {
      throw new Error('Repository or file not found.');
    } else {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
};

const getLanguageFromPath = (path) => {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    // Add more extensions as needed
  };
  return langMap[ext] || 'unknown';
};

export const fetchRepositoryTree = async (owner, repo, branch, token) => {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const data = await fetchWithAuth(url, token);
  return data.tree.map(item => ({
    path: item.path,
    type: item.type,
    size: item.size,
  }));
};

export const fetchFileContent = async (owner, repo, path, token) => {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const data = await fetchWithAuth(url, token);

  if (data.type !== 'file') {
    throw new Error('The specified path is not a file.');
  }

  // Decode base64 content
  const content = atob(data.content.replace(/\n/g, ''));

  const language = getLanguageFromPath(path);

  return {
    path,
    content,
    language,
  };
};

export const fetchMultipleFiles = async (owner, repo, branch, token) => {
  const tree = await fetchRepositoryTree(owner, repo, branch, token);

  // Smart filtering
  const filtered = tree
    .filter(item => {
      if (item.type !== 'blob') return false;
      if (item.size > 100 * 1024) return false; // Exclude files > 100KB
      if (item.path.includes('node_modules') || item.path.includes('build') || item.path.includes('dist') || item.path.includes('.git')) return false;

      // Prioritize source code files
      const ext = item.path.split('.').pop()?.toLowerCase();
      const sourceExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'html', 'css', 'json', 'md'];
      return sourceExts.includes(ext);
    })
    .sort((a, b) => {
      // Prioritize smaller files first, then by extension priority
      const extA = a.path.split('.').pop()?.toLowerCase();
      const extB = b.path.split('.').pop()?.toLowerCase();
      const priority = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'html', 'css', 'json', 'md'];
      const priA = priority.indexOf(extA);
      const priB = priority.indexOf(extB);
      if (priA !== priB) return priA - priB;
      return a.size - b.size;
    })
    .slice(0, 20); // Limit to top 20

  const files = await Promise.all(
    filtered.map(async (item) => {
      try {
        return await fetchFileContent(owner, repo, item.path, token);
      } catch (error) {
        console.warn(`Failed to fetch content for ${item.path}:`, error.message);
        return null; // Skip failed files
      }
    })
  ).then(results => results.filter(Boolean)); // Remove nulls

  return {
    tree,
    files,
  };
};