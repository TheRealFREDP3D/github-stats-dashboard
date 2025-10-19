# LLM Integration Architecture and Service Layer

## Overview

Complete flow of LLM integration from configuration through repository analysis to results display. This document outlines the key components including LLM context management, repository analysis orchestration, GitHub content fetching, multi-provider LLM service, and analysis results rendering.

---

## Architecture Components

### Component Overview

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| **LLM Configuration Management** | User configures LLM provider and API key through settings dialog, persisted in localStorage | `LLMSettingsDialog.jsx`, `LLMContext.jsx` |
| **Repository Analysis Trigger** | User initiates repository analysis from detail view, triggering the analysis workflow | `RepoDetail.jsx`, `useRepoAnalysis.js` |
| **GitHub Content Fetching Pipeline** | Smart fetching and filtering of repository files for LLM analysis | `githubContentService.js` |
| **Multi-Provider LLM Service** | Unified LLM service routes requests to different providers based on configuration | `llmService.js` |
| **Analysis Results Display** | LLM analysis results rendered in tabbed interface with file-by-file breakdown | `RepoDetail.jsx`, `RepoAnalysis.jsx` |

---

## 1. LLM Configuration Management

User configures LLM provider and API key through settings dialog, persisted in localStorage.

### Flow Diagram

```
User opens settings dialog
    ↓
handleSave() validation
    ↓
Provider Selection → LLMContext state update
    ↓
API Key Storage → setProviderState()
    ↓                setApiKeys()
localStorage persistence
    ↓
Context provider wraps app → useLLM() hook access
    ↓
Returns provider, apiKeys, etc.
```

### Key Implementation Points

#### 1a. Provider Selection
**File:** `LLMSettingsDialog.jsx` (Line 44)
```javascript
setProvider(localProvider);
```

#### 1b. API Key Storage
**File:** `LLMSettingsDialog.jsx` (Line 45)
```javascript
setApiKey(localProvider, localKeys[localProvider].trim());
```

#### 1c. Provider Persistence
**File:** `LLMContext.jsx` (Line 38)
```javascript
localStorage.setItem('llmProvider', provider);
```

#### 1d. API Keys Persistence
**File:** `LLMContext.jsx` (Line 39)
```javascript
localStorage.setItem('llmApiKeys', JSON.stringify(apiKeys));
```

---

## 2. Repository Analysis Trigger

User initiates repository analysis from detail view, triggering the analysis workflow.

### Flow Diagram

```
Analysis Button Click
    ↓
useRepoAnalysis.analyzeRepository()
    ↓
Configuration Validation → Check provider & API key
    ↓
GitHub Data Fetch → fetchMultipleFiles() call
    ↓
LLM Analysis Call → analyzeRepo() call
    ↓
Result Caching → localStorage.setItem()
    ↓
UI state updates → setLoading(true)
                   setAnalysis(result)
                   setIsAnalyzed(true)
```

### Key Implementation Points

#### 2a. Analysis Button Click
**File:** `RepoDetail.jsx` (Line 271)
```jsx
<Button onClick={analyzeRepository} disabled={loading}>
```

#### 2b. Configuration Validation
**File:** `useRepoAnalysis.js` (Line 32)
```javascript
if (!provider || !apiKeys[provider]) {
  // Check provider & API key
}
```

#### 2c. GitHub Data Fetch
**File:** `useRepoAnalysis.js` (Line 41)
```javascript
const repoData = await fetchMultipleFiles(owner, name, defaultBranch, token);
```

#### 2d. LLM Analysis Call
**File:** `useRepoAnalysis.js` (Line 42)
```javascript
const result = await analyzeRepo(provider, apiKeys[provider], repoData);
```

#### 2e. Result Caching
**File:** `useRepoAnalysis.js` (Line 45)
```javascript
localStorage.setItem(cacheKey, JSON.stringify(result));
```

---

## 3. GitHub Content Fetching Pipeline

Smart fetching and filtering of repository files for LLM analysis.

### Flow Diagram

```
fetchMultipleFiles() entry point
    ↓
Repository Tree Fetch → fetchWithAuth() helper
    ↓
Smart Filtering → File size filtering
                  Directory exclusion
    ↓
Source File Prioritization → Sorting & limiting
    ↓
Parallel Content Fetch → fetchFileContent() calls
                         fetchWithAuth() helper
    ↓
Base64 Decoding → Language detection
```

### Key Implementation Points

#### 3a. Repository Tree Fetch
**File:** `githubContentService.js` (Line 43)
```javascript
const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
```

#### 3b. Smart Filtering
**File:** `githubContentService.js` (Line 76)
```javascript
const filtered = tree.filter(item => {
  // File size filtering
  // Directory exclusion
});
```

#### 3c. Source File Prioritization
**File:** `githubContentService.js` (Line 84)
```javascript
const sourceExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'html', 'css', 'json', 'md'];
```

#### 3d. Parallel Content Fetch
**File:** `githubContentService.js` (Line 99)
```javascript
const files = await Promise.all(filtered.map(async (item) => {
  // fetchFileContent() calls
}));
```

#### 3e. Base64 Decoding
**File:** `githubContentService.js` (Line 61)
```javascript
const content = atob(data.content.replace(/\n/g, ''));
```

---

## 4. Multi-Provider LLM Service Processing

Unified LLM service routes requests to different providers based on configuration.

### Flow Diagram

```
Service Entry Point
    ↓
Prompt Construction → Format repository data & files
                      Add JSON response template
    ↓
Provider Routing → switch (provider)
    ↓
┌───────────────────┬─────────────────────┬──────────────────────┐
│                   │                     │                      │
analyzeWithOpenRouter  analyzeWithGemini   analyzeWithOpenAI
│                   │                     │                      │
OpenRouter API Call   Gemini API Call     OpenAI API Call
│                   │                     │                      │
└───────────────────┴─────────────────────┴──────────────────────┘
    ↓
Response Parsing → JSON.parse() response
```

### Key Implementation Points

#### 4a. Service Entry Point
**File:** `llmService.js` (Line 179)
```javascript
export const analyzeRepository = async (provider, apiKey, repositoryData) => {
  // Entry point for all LLM analysis requests
}
```

#### 4b. Provider Routing
**File:** `llmService.js` (Line 184)
```javascript
switch (provider) {
  case 'openrouter':
    return await analyzeWithOpenRouter(apiKey, repositoryData);
  case 'gemini':
    return await analyzeWithGemini(apiKey, repositoryData);
  case 'openai':
    return await analyzeWithOpenAI(apiKey, repositoryData);
}
```

#### 4c. Prompt Construction
**File:** `llmService.js` (Line 14)
```javascript
const createPrompt = (repositoryData) => {
  // Format repository data & files
  // Add JSON response template
}
```

#### 4d. OpenRouter API Call
**File:** `llmService.js` (Line 61)
```javascript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  // Send structured prompt
});
```

#### 4e. Response Parsing
**File:** `llmService.js` (Line 86)
```javascript
return JSON.parse(content);
```

### Supported Providers

| Provider | API Endpoint | Model Support |
|----------|--------------|---------------|
| **OpenRouter** | `https://openrouter.ai/api/v1/chat/completions` | Various open-source models |
| **Gemini** | Google AI API | Gemini models |
| **OpenAI** | `https://api.openai.com/v1/chat/completions` | GPT models |

---

## 5. Analysis Results Display Pipeline

LLM analysis results rendered in tabbed interface with file-by-file breakdown.

### Flow Diagram

```
Analysis Component Render
    ↓
RepoAnalysis receives analysis prop
    ↓
Tabbed Interface → Overview tab content
                   Files tab content
                   Suggestions tab content
    ↓
File Analysis Mapping → Individual file accordions
                        File summary display
                        File suggestions display
    ↓
Suggestions Display → Category badges
                      Suggestion text rendering
    ↓
Error handling for empty data
ScrollArea components for each tab
```

### Data Flow Sources

- Analysis data flow from `useRepoAnalysis`
- Cached results from localStorage
- Real-time results from LLM service

### Key Implementation Points

#### 5a. Analysis Component Render
**File:** `RepoDetail.jsx` (Line 278)
```jsx
<RepoAnalysis analysis={analysis} />
```

#### 5b. Tabbed Interface
**File:** `RepoAnalysis.jsx` (Line 23)
```jsx
<Tabs defaultValue="overview" className="w-full">
  {/* Overview tab content */}
  {/* Files tab content */}
  {/* Suggestions tab content */}
</Tabs>
```

#### 5c. File Analysis Mapping
**File:** `RepoAnalysis.jsx` (Line 64)
```jsx
{analysis.files.map((file, index) => (
  // Individual file accordions
  // File summary display
  // File suggestions display
))}
```

#### 5d. Suggestions Display
**File:** `RepoAnalysis.jsx` (Line 111)
```jsx
{analysis.generalSuggestions.map((suggestion, index) => (
  // Category badges
  // Suggestion text rendering
))}
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Configuration                            │
│  (LLMSettingsDialog → LLMContext → localStorage)                │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Analysis Trigger                              │
│  (RepoDetail → useRepoAnalysis)                                 │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                GitHub Content Fetch                              │
│  (githubContentService → Smart Filtering → File Content)        │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LLM Processing                                │
│  (llmService → Provider API → JSON Response)                    │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                Result Caching & Display                          │
│  (localStorage → RepoAnalysis → Tabbed UI)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### Smart File Filtering
- **Size limits:** Excludes files over certain threshold
- **Directory exclusion:** Skips `node_modules`, `.git`, `dist`, etc.
- **Source file prioritization:** Focuses on code files (js, jsx, ts, tsx, py, etc.)

### Caching Strategy
- Results cached in localStorage with repository-specific keys
- Reduces API calls and improves performance
- Cache invalidation on re-analysis

### Error Handling
- Provider validation before API calls
- API key verification
- Graceful failure with user feedback
- Empty data handling in UI components

### Performance Optimizations
- Parallel file content fetching with `Promise.all`
- Smart file limiting to avoid token limits
- Lazy loading of analysis results

---

## Configuration Requirements

### Required API Keys

Users must configure at least one of the following:

1. **OpenRouter API Key**
   - Obtain from: https://openrouter.ai
   - Stored in: `localStorage['llmApiKeys'].openrouter`

2. **Google Gemini API Key**
   - Obtain from: https://ai.google.dev
   - Stored in: `localStorage['llmApiKeys'].gemini`

3. **OpenAI API Key**
   - Obtain from: https://platform.openai.com
   - Stored in: `localStorage['llmApiKeys'].openai`

### GitHub Token Requirements

- Required for fetching repository content
- Must have `repo` scope for private repositories
- Stored separately from LLM configuration

---

## Security Considerations

⚠️ **Important:** All API keys are stored in browser localStorage
- Keys are client-side only
- No server-side storage or proxying
- Keys are sent directly to provider APIs
- Users should use keys with minimal required permissions
- Regular key rotation recommended

---

## Future Enhancements

### Potential Improvements
- [ ] Server-side key management for production deployments
- [ ] Streaming responses for real-time analysis feedback
- [ ] Analysis history and comparison features
- [ ] Custom prompt templates
- [ ] Model selection per provider
- [ ] Token usage tracking and budgeting
- [ ] Batch repository analysis
- [ ] Export analysis reports

---

## Troubleshooting Guide

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "No provider configured" | LLM provider not selected | Open settings and select a provider |
| "API key missing" | No API key for selected provider | Add API key in settings dialog |
| "Analysis failed" | Invalid API key or rate limit | Verify API key and check provider limits |
| Empty analysis results | Repository too large or no code files | Check repository size and file types |
| Cached outdated results | Previous analysis stored | Re-run analysis to refresh cache |

---

## Related Documentation

- [GitHub Stats Dashboard README](../README.md)
- [API Integration Guide](./API_INTEGRATION.md)
- [Component Documentation](./COMPONENTS.md)
- [Security Best Practices](./SECURITY.md)

---

**Last Updated:** October 18, 2025  
**Version:** 1.0.0  
**Maintainer:** TheRealFREDP3D