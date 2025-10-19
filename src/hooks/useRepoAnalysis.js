import { useState, useEffect } from 'react';
import { useLLM } from '../contexts/LLMContext';
import { fetchMultipleFiles } from '../services/githubContentService';
import { analyzeRepository as analyzeRepo } from '../services/llmService';

export const useRepoAnalysis = (owner, name, defaultBranch, token) => {
  const { provider, apiKeys } = useLLM();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const cacheKey = `repo-analysis-${owner}-${name}-${defaultBranch}`;

  useEffect(() => {
    // Load cached analysis on mount
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAnalysis(parsed);
        setIsAnalyzed(true);
      } catch (e) {
        // Ignore invalid cache
      }
    }
  }, [cacheKey]);

  // Clear analysis when provider or API key changes
  useEffect(() => {
    clearAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, apiKeys[provider]]);

  const analyzeRepository = async () => {
    if (loading || isAnalyzed) return;

    if (!provider || !apiKeys[provider]) {
      setError('LLM provider not configured. Please set up your API key in settings.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const repoData = await fetchMultipleFiles(owner, name, defaultBranch, token);
      const result = await analyzeRepo(provider, apiKeys[provider], repoData);
      setAnalysis(result);
      setIsAnalyzed(true);
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setIsAnalyzed(false);
    setError(null);
    localStorage.removeItem(cacheKey);
  };

  return {
    analysis,
    loading,
    error,
    analyzeRepository,
    clearAnalysis,
    isAnalyzed,
  };
};