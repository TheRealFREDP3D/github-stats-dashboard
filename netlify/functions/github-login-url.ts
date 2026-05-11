import { Handler } from '@netlify/functions';

interface PKCERequest {
  code_challenge: string;
  state: string;
}

export const handler: Handler = async (event) => {
  // CORS headers for production
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST for PKCE flow in production
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Use POST with PKCE parameters." }),
    };
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      console.error('GITHUB_CLIENT_ID environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID in Netlify environment variables." 
        }),
      };
    }

    // Use the Netlify site URL for redirect in production
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
    if (!siteUrl) {
      console.error('URL environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Site URL not configured. This should be automatically set by Netlify."
        }),
      };
    }

    // Redirect back to the site root with OAuth callback parameters
    const redirectUri = siteUrl;

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing request body for PKCE flow" }),
      };
    }

    let body: PKCERequest;
    try {
      body = JSON.parse(event.body) as PKCERequest;
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    const { code_challenge, state } = body;

    if (!code_challenge || !state) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing code_challenge or state in request body" }),
      };
    }

    // Build OAuth URL with PKCE parameters
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo,user',
      state: state,
      code_challenge: code_challenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `https://github.com/login/oauth/authorize?${authParams.toString()}`;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: authUrl }),
    };
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to generate OAuth URL" }),
    };
  }
};
