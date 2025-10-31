# LLM Configuration Context (`LLMContext.jsx`)

```mermaid
graph TD


```


## Overview

The file `/src/contexts/LLMContext.jsx` in the Github-Stats-Dashboard project serves as a React Context for managing the application's Large Language Model (LLM) provider selection and its associated API keys. Crucially, this component does **not** directly act as an LLM API client. Instead, it functions as a centralized **configuration layer**, providing the necessary settings for an external LLM API service to make actual API calls.

## Purpose

The primary purpose of `LLMContext.jsx` is to:

-   **Centralize LLM Configuration**: Store the currently selected LLM provider (e.g., 'openrouter', 'gemini', 'openai') and their respective API keys.
-   **Provide Global Access**: Make this configuration easily accessible to any part of the application without prop drilling.
-   **Persist Preferences**: Save user's LLM provider and API key preferences across browser sessions using `localStorage`.
-   **Indicate Readiness**: Provide a derived state (`isConfigured`) to quickly check if a valid LLM provider and key are present.

## Key Components and Structure

### `LLMContext` Object

This is the actual React Context created using `createContext()`. It's the mechanism through which the LLM configuration value is passed down the component tree.

### `LLMProvider` Component

This is a React functional component that acts as the provider for the `LLMContext`. It encapsulates the state management and logic for the LLM configuration.

-   **Internal State**: Manages the following state variables using `useState` and `useEffect` hooks:
    -   `provider`: A string representing the currently selected LLM (e.g., 'openrouter'). Defaults to 'openrouter'.
    -   `apiKeys`: An object mapping LLM provider names to their respective API keys. Initialized with empty strings for supported providers.
    -   `isConfigured`: A boolean derived state indicating whether a `provider` is selected and its corresponding `apiKeys` entry is non-empty.
-   **Methods**: Exposes functions to update its internal state:
    -   `setProvider(newProvider)`: Updates the `provider` state.
    -   `setApiKey(providerKey, key)`: Updates a specific API key within the `apiKeys` object.
-   **Persistence**: Uses `useEffect` hooks to synchronize the `provider` and `apiKeys` state with `localStorage`, ensuring data persistence across sessions.

### `useLLM()` Hook

This is a custom React hook that simplifies consuming the `LLMContext`. Any functional component within the `LLMProvider`'s tree can call `useLLM()` to access the current `provider`, `apiKeys`, `isConfigured`, and the `setProvider`/`setApiKey` functions. It includes a check to ensure it's used within an `LLMProvider` to prevent runtime errors.

## Interactions

### With `localStorage`

`LLMProvider` interacts directly with the browser's `localStorage` to:

-   **Load State**: Retrieve previously saved `provider` and `apiKeys` when the component mounts.
-   **Save State**: Persist changes to `provider` and `apiKeys` whenever they are updated.

### With Application Components

Application components that need to configure or use LLM functionality interact with `LLMContext.jsx` indirectly by:

-   **Wrapping**: Being rendered as children of the `LLMProvider` component.
-   **Consuming**: Calling the `useLLM()` hook to access the current LLM configuration and update functions.

### With an External LLM API Service (Conceptual)

While `LLMContext.jsx` itself does not make API calls, it provides the essential configuration to a separate, conceptual `LLM API Service` (e.g., a file like `src/services/llmService.js`). This service would:

1.  **Obtain Configuration**: Use the `useLLM()` hook (or directly access the context value) to get the `provider` and `apiKeys`.
2.  **Construct Requests**: Use this information to build and authenticate requests to the chosen LLM provider's API endpoint.

## Role Clarification: Configuration vs. Client

It is critical to understand that `LLMContext.jsx` functions purely as a **configuration management system**. It provides the *parameters* (which LLM to use, what API key) needed for LLM interactions. The actual HTTP requests to external LLM APIs would be handled by a separate module or service that consumes these parameters.

## Diagram: LLM Configuration Context Internal Structure and Interactions

```mermaid
C4Component
    title LLM Configuration Context (LLMContext.jsx)

    Component(LLMProvider, "LLMProvider Component", "React Context Provider") {
        Container(State, "Internal State", "React useState/useEffect") {
            Component(ProviderVar, "provider", "string", "Current LLM provider (e.g., 'openrouter')")
            Component(ApiKeysVar, "apiKeys", "object", "Map of LLM provider to API key")
            Component(IsConfiguredVar, "isConfigured", "boolean", "Derived state: provider & key present")
        }
        Component(SetProviderFunc, "setProvider(newProvider)", "Function", "Updates 'provider' state")
        Component(SetApiKeyFunc, "setApiKey(providerKey, key)", "Function", "Updates 'apiKeys' state for a provider")
    }

    Component(LLMContextObject, "LLMContext Object", "React Context", "Provides LLM configuration to consumers")

    Component(UseLLMHook, "useLLM() Hook", "Custom React Hook", "Consumes LLMContext, provides access to config")

    Boundary(LocalStorageBoundary, "Browser Local Storage") {
        Component(LocalStorage, "localStorage", "Web API", "Persists 'provider' and 'apiKeys'")
    }

    Rel(LLMProvider, State, "Manages", "React useState/useEffect")
    Rel(LLMProvider, LLMContextObject, "Provides value to", "via .Provider")
    Rel(LLMProvider, LocalStorage, "Persists/Loads state from", "via useEffect")

    Rel(UseLLMHook, LLMContextObject, "Consumes", "via useContext")

    Component(ApplicationComponent, "Application Components", "React Components", "UI elements that need LLM configuration")
    Rel(ApplicationComponent, UseLLMHook, "Uses", "to get LLM config")

    Component(LLMAPIService, "LLM API Service", "JavaScript Module (e.g., llmService.js)", "Makes actual API calls to LLM providers")
    Rel(LLMAPIService, UseLLMHook, "Receives config from", "indirectly via ApplicationComponent / direct import of useLLM")
    note right of LLMAPIService
        `LLMContext.jsx` does NOT make API calls.
        It provides the *configuration* for an
        external `LLM API Service` to use.
    end note
```

---
*Generated by [CodeViz.ai](https://codeviz.ai) on 10/31/2025, 7:01:30 AM*
