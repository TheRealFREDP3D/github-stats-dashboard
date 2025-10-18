// src/services/llmService.js

/**
 * Unified LLM service for analyzing GitHub repositories using OpenRouter, Gemini, or OpenAI.
 */

/**
 * Creates a structured prompt for repository analysis.
 * @param {Object} repositoryData - The repository data containing tree and files.
 * @param {Array} repositoryData.tree - Array of file tree items with path, type, size.
 * @param {Array} repositoryData.files - Array of file objects with path, content, language.
 * @returns {string} The formatted prompt.
 */
const createPrompt = (repositoryData) => {
  let prompt = "Analyze the following GitHub repository code.\n\n";

  prompt += "File Structure:\n";
  repositoryData.tree.forEach(item => {
    prompt += `- ${item.path} (${item.type}, ${item.size} bytes)\n`;
  });

  prompt += "\nFile Contents:\n";
  repositoryData.files.forEach(file => {
    prompt += `File: ${file.path}\nLanguage: ${file.language}\nContent:\n${file.content}\n\n`;
  });

  prompt += "Please provide a detailed analysis in the following JSON format:\n";
  prompt += `{
  "overview": "A high-level overview of the repository's architecture, purpose, and main components.",
  "files": [
    {
      "path": "path/to/file",
      "summary": "Summary of what this file does and its role in the project.",
      "suggestions": "Any improvement suggestions for this file."
    }
  ],
  "generalSuggestions": "General improvement suggestions for the entire repository."
}`;

  return prompt;
};

/**
 * Analyzes a repository using OpenRouter API.
 * @param {string} apiKey - The OpenRouter API key.
 * @param {Object} repositoryData - The repository data.
 * @returns {Promise<Object>} The analysis result.
 */
const analyzeWithOpenRouter = async (apiKey, repositoryData) => {
  const prompt = createPrompt(repositoryData);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o', // Default model; can be made configurable
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenRouter API');
  }

  const content = data.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error('Failed to parse JSON response from OpenRouter');
  }
};

/**
 * Analyzes a repository using Google Gemini API.
 * @param {string} apiKey - The Gemini API key.
 * @param {Object} repositoryData - The repository data.
 * @returns {Promise<Object>} The analysis result.
 */
const analyzeWithGemini = async (apiKey, repositoryData) => {
  const prompt = createPrompt(repositoryData);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
    throw new Error('Invalid response from Gemini API');
  }

  const content = data.candidates[0].content.parts[0].text;
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error('Failed to parse JSON response from Gemini');
  }
};

/**
 * Analyzes a repository using OpenAI API.
 * @param {string} apiKey - The OpenAI API key.
 * @param {Object} repositoryData - The repository data.
 * @returns {Promise<Object>} The analysis result.
 */
const analyzeWithOpenAI = async (apiKey, repositoryData) => {
  const prompt = createPrompt(repositoryData);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenAI API');
  }

  const content = data.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error('Failed to parse JSON response from OpenAI');
  }
};

/**
 * Main function to analyze a repository using the specified LLM provider.
 * @param {string} provider - The LLM provider ('openrouter', 'gemini', 'openai').
 * @param {string} apiKey - The API key for the provider.
 * @param {Object} repositoryData - The repository data containing tree and files.
 * @returns {Promise<Object>} The unified analysis result: { overview, files: [{path, summary, suggestions}], generalSuggestions }.
 */
export const analyzeRepository = async (provider, apiKey, repositoryData) => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  switch (provider) {
    case 'openrouter':
      return await analyzeWithOpenRouter(apiKey, repositoryData);
    case 'gemini':
      return await analyzeWithGemini(apiKey, repositoryData);
    case 'openai':
      return await analyzeWithOpenAI(apiKey, repositoryData);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};