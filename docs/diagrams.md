# Github Stats Dashboard - Diagrams

## Sequence diagram for repository analysis trigger and LLM processing

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Dashboard
    participant RepoDetail
    participant useRepoAnalysis
    participant githubContentService
    participant llmService
    User->>App: Submit GitHub token
    App->>Dashboard: Pass token as prop
    User->>Dashboard: Click repository card
    Dashboard->>RepoDetail: Pass selected repo and token
    User->>RepoDetail: Click "Analyze Repository"
    RepoDetail->>useRepoAnalysis: analyzeRepository()
    useRepoAnalysis->>githubContentService: fetchMultipleFiles(owner, name, defaultBranch, token)
    githubContentService-->>useRepoAnalysis: {tree, files}
    useRepoAnalysis->>llmService: analyzeRepo(provider, apiKey, repoData)
    llmService-->>useRepoAnalysis: analysis result
    useRepoAnalysis->>RepoDetail: setAnalysis(result)
    RepoDetail->>Dashboard: Display analysis results
```

---

## Class Diagram

```mermaid
classDiagram
    class App {
      +submittedToken: string
      +repositories: array
      +loading: boolean
      +error: string
    }
    class Dashboard {
      +repositories: array
      +loading: boolean
      +error: string
      +token: string
      +selectedRepo: object
      +setSelectedRepo(repo)
    }
    class RepoDetail {
      +repo: object
      +onClose: function
      +layoutId: string
      +token: string
      +showAnalysis: boolean
      +settingsOpen: boolean
    }
    App --> Dashboard : passes token
    Dashboard --> RepoDetail : passes repo and token
```

---

## Class diagram for useRepoAnalysis hook with updated cache key and reset logic

```mermaid
classDiagram
    class useRepoAnalysis {
      +owner: string
      +name: string
      +defaultBranch: string
      +token: string
      +analysis: object
      +isAnalyzed: boolean
      +cacheKey: string
      +analyzeRepository()
      +clearAnalysis()
    }
    useRepoAnalysis : cacheKey = "repo-analysis-${owner}-${name}-${defaultBranch}"
    useRepoAnalysis : clearAnalysis() called when provider or API key changes
```

---

## Class diagram for repository object with defaultBranch attribute

```mermaid
    class Repository {
      +id: number
      +name: string
      +owner: object
      +description: string
      +html_url: string
      +language: string
      +stargazers_count: number
      +forks_count: number
      +open_issues_count: number
      +defaultBranch: string
      +viewsData: array
      +clonesData: array
      +socialImage: string
    }
```

---
