pnpm approve-builds# GitHub Stats Dashboard

An interactive dashboard for visualizing GitHub repository statistics including traffic, clones, forks, pull requests, and issues.

## Features

### 📊 Repository Overview Cards

- **Grid Layout**: Clean, responsive card-based layout displaying all your repositories
- **Key Metrics**: Each card shows:
  - Total views and unique views
  - Clone counts (total and unique)
  - Fork count
  - Star count
  - Pull request count
  - Issue count
  - Primary programming language
- **Repository Icons**: Uses GitHub's social preview images (OpenGraph images) as repository icons
- **Hover Effects**: Smooth animations and visual feedback on card hover

### 🎯 Detailed Repository View

- **Smooth Animations**: Cards expand with fluid animations into full-screen detail views
- **Comprehensive Statistics**:
  - Traffic overview with total and unique metrics
  - Activity summary (PRs, issues, stars, forks)
  - Interactive charts showing traffic trends over the last 14 days
  - Repository metadata (language, creation date, last update)
- **Visual Data**: Area charts powered by Recharts showing views and clones over time
- **Easy Navigation**: Click anywhere outside or use the close button to return to the grid

### 🔐 Secure Authentication

- **Personal Access Token**: Uses GitHub PAT for secure API access
- **Local Storage**: Token is stored only in your browser, never sent to any server except GitHub
- **Privacy First**: All API calls go directly from your browser to GitHub

### 🤖 AI-Powered Code Analysis

- Support for multiple LLM providers (OpenRouter, Gemini, OpenAI)
- Repository architecture understanding
- Per-file code summaries
- Improvement suggestions

## Getting Started

### Prerequisites

- A GitHub account
- A GitHub Personal Access Token with appropriate permissions

### Creating a GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give your token a descriptive name (e.g., "Stats Dashboard")
4. Select the following scopes:
   - `repo` - Full control of private repositories (required for traffic data)
   - OR `public_repo` - Access to public repositories only
5. Click **"Generate token"**
6. **Copy the token immediately** - you won't be able to see it again!

### Using the Dashboard

1. Open the deployed dashboard URL
2. Paste your GitHub Personal Access Token into the input field
3. Click **"Load Repositories"**
4. Browse your repository cards
5. Click any card to view detailed statistics and charts

### Configuring LLM Analysis

To use the AI-powered code analysis feature:

1. Access the settings by clicking the settings icon in the dashboard header or within a repository detail view
2. Select your preferred LLM provider (OpenRouter, Gemini, or OpenAI)
3. Enter your API key for the selected provider:
   - [OpenRouter](https://openrouter.ai)
   - [Gemini](https://ai.google.dev)
   - [OpenAI](https://platform.openai.com)
4. Your API keys are stored locally in your browser's localStorage for convenience

## Technical Stack

- **Frontend Framework**: React 19
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Package Manager**: pnpm

## API Endpoints Used

The dashboard fetches data from the following GitHub REST API endpoints:

- `GET /user/repos` - List user repositories
- `GET /repos/{owner}/{repo}` - Repository details
- `GET /repos/{owner}/{repo}/traffic/views` - View statistics (last 14 days)
- `GET /repos/{owner}/{repo}/traffic/clones` - Clone statistics (last 14 days)
- `GET /repos/{owner}/{repo}/pulls` - Pull request data
- `GET /repos/{owner}/{repo}/issues` - Issue data
- `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1` - Repository file tree
- `GET /repos/{owner}/{repo}/contents/{path}` - File contents

## Features Breakdown

### Repository Card Component

Each repository card displays:

- Repository name and description
- Social preview image (OpenGraph)
- Views (total and unique)
- Clones (total and unique)
- Forks count
- Stars count
- Pull requests count
- Issues count
- Primary programming language badge

### Detail View Component

The expanded detail view includes:

- Full repository header with icon and description
- Link to view repository on GitHub
- Overview section with large metric cards
- Activity section showing PRs and issues
- Traffic chart with 14-day trend data
- Repository information (language, dates, owner)

### Animation System

- Smooth card-to-detail expansion using Framer Motion's `layoutId`
- Hover animations on cards
- Fade transitions between views
- Micro-interactions throughout the UI

## Development

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Project Structure

```
github-stats-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── Dashboard.jsx    # Main dashboard container
│   │   ├── RepoCard.jsx     # Repository card component
│   │   └── RepoDetail.jsx   # Detailed view component
│   ├── hooks/
│   │   └── useGitHubAPI.js  # Custom hook for GitHub API
│   ├── App.jsx              # Main application component
│   ├── App.css              # Global styles and theme
│   └── main.jsx             # Application entry point
├── public/                  # Static assets
└── package.json
```

## Limitations

- **Traffic Data**: GitHub API only provides traffic data for the last 14 days
- **Rate Limiting**: GitHub API has rate limits (5,000 requests/hour for authenticated requests)
- **Repository Access**: You can only see statistics for repositories you have access to
- **Real-time Updates**: Data is fetched on load; refresh to see updated statistics

## Future Enhancements

Potential features for future versions:

- Historical data storage to track trends beyond 14 days
- Comparison view between multiple repositories
- Export functionality for statistics
- Dark/light theme toggle
- Filtering and sorting options
- Search functionality
- Organization repository support
- Webhook integration for real-time updates

## Security Notes

- Your GitHub token is stored only in your browser's memory during the session
- The token is never sent to any server except GitHub's official API
- Always use tokens with minimal required permissions
- Regularly rotate your tokens for security
- Never share your tokens or commit them to version control
- LLM API keys are stored in your browser's localStorage; consider rotating them regularly and avoid using keys with excessive permissions

## License

This project is open source and available for personal and commercial use.

## Support

For issues, questions, or contributions, please refer to the project repository.

---

Built with ❤️ using React, Tailwind CSS, and GitHub API
