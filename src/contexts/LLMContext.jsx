import React, { createContext, useContext, useState, useEffect } from 'react';

const LLMContext = createContext();

export const LLMProvider = ({ children }) => {
  const [provider, setProviderState] = useState('openrouter');
  const [apiKeys, setApiKeys] = useState({
    openrouter: '',
    gemini: '',
    openai: '',
  });

  const isConfigured = provider && apiKeys[provider];

  const setProvider = (newProvider) => {
    setProviderState(newProvider);
  };

  const setApiKey = (providerKey, key) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerKey]: key,
    }));
  };

  useEffect(() => {
    const storedProvider = localStorage.getItem('llmProvider');
    const storedApiKeys = localStorage.getItem('llmApiKeys');
    if (storedProvider) {
      setProviderState(storedProvider);
    }
    if (storedApiKeys) {
      setApiKeys(JSON.parse(storedApiKeys));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('llmProvider', provider);
    localStorage.setItem('llmApiKeys', JSON.stringify(apiKeys));
  }, [provider, apiKeys]);

  return (
    <LLMContext.Provider value={{ provider, apiKeys, setProvider, setApiKey, isConfigured }}>
      {children}
    </LLMContext.Provider>
  );
};

export const useLLM = () => {
  const context = useContext(LLMContext);
  if (!context) {
    throw new Error('useLLM must be used within an LLMProvider');
  }
  return context;
};