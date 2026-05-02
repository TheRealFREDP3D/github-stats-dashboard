import { Handler } from '@netlify/functions';
import crypto from 'crypto';

export const handler: Handler = async (event) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable." 
        }),
      };
    }

    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    
    if (!redirectUri) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "GitHub OAuth not configured. Please set GITHUB_REDIRECT_URI environment variable for this environment (e.g. http://localhost:8888/auth/github/callback)."
        }),
      };
    }

    // Generate a cryptographically strong random state value for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user&state=${state}`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Persist state in an HTTP-only, secure cookie so it can be validated on the callback
        'Set-Cookie': [
          `github_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        ],
      },
      body: JSON.stringify({ url: authUrl }),
    };
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate OAuth URL" }),
    };
  }
};
