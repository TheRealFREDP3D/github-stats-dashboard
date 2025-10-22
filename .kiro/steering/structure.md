# Project Structure & Organization

## Directory Layout

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components (46+ reusable UI primitives)
│   ├── Dashboard.jsx    # Main dashboard container
│   ├── RepoCard.jsx     # Repository card component
│   ├── RepoDetail.jsx   # Repository detail view
│   ├── RepoAnalysis.jsx # AI code analysis component
│   └── LLMSettingsDialog.jsx # LLM provider configuration
├── hooks/               # Custom React hooks
│   ├── useGitHubAPI.js  # GitHub API integration
│   ├── useRepoAnalysis.js # LLM analysis workflow
│   └── use-mobile.js    # Mobile detection utility
├── contexts/            # React Context providers
│   └── LLMContext.jsx   # LLM configuration state
├── services/            # External API services
│   ├── githubContentService.js # GitHub content fetching
│   └── llmService.js    # LLM provider integration
├── lib/                 # Utility functions
│   └── utils.js         # Common utilities (cn helper)
├── assets/              # Static assets
└── App.jsx              # Root application component
```

## Component Architecture

- **Container Components**: `Dashboard.jsx` manages state and layout
- **Presentation Components**: `RepoCard.jsx`, `RepoDetail.jsx` handle display logic
- **Feature Components**: `RepoAnalysis.jsx`, `LLMSettingsDialog.jsx` for specific features
- **UI Components**: Located in `components/ui/` - reusable shadcn/ui primitives

## State Management Patterns

- **Local State**: useState for component-specific state
- **Global State**: React Context for cross-component data (LLM configuration)
- **Server State**: Custom hooks for API data fetching and caching
- **Persistent State**: localStorage for user preferences and API keys

## File Naming Conventions

- **Components**: PascalCase with `.jsx` extension (`RepoCard.jsx`)
- **Hooks**: camelCase starting with `use` prefix (`.js` extension)
- **Services**: camelCase with descriptive suffix (`.js` extension)
- **Utilities**: camelCase (`.js` extension)

## Import/Export Patterns

- **Default Exports**: For main components and services
- **Named Exports**: For utility functions and hooks
- **Barrel Exports**: Not used - direct imports preferred
- **Path Aliases**: Use `@/` for src imports, relative paths for same-directory imports

## API Integration

- **GitHub API**: Centralized in `useGitHubAPI.js` hook
- **LLM APIs**: Abstracted through `llmService.js` with provider switching
- **Error Handling**: Consistent error boundaries and user feedback
- **Rate Limiting**: Handled gracefully with user notifications