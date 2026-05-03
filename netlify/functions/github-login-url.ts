import { Handler } from '@netlify/functions';
import crypto from 'crypto';

interface PKCERequest {
  code_challenge: string;
  state: string;
}

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
          error: "GitHub OAuth not configured. Please set GITHUB_REDIRECT_URI environment variable for this environment (e.g. http://localhost:3000/auth/github/callback)."
        }),
      };
    }

    let codeChallenge: string;
    let state: string;

    // Handle both GET (legacy) and POST (PKCE) requests
    if (event.httpMethod === 'POST') {
      // PKCE flow - client sends code_challenge and state
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing request body for PKCE flow" }),
        };
      }

      try {
        const body = JSON.parse(event.body) as PKCERequest;
        codeChallenge = body.code_challenge;
        state = body.state;

        if (!codeChallenge || !state) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing code_challenge or state in request body" }),
          };
        }
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid JSON in request body" }),
        };
      }
    } else {
      // Legacy flow - generate server-side state (not recommended for production)
      state = crypto.randomBytes(16).toString('hex');
      codeChallenge = ''; // Not used in legacy flow
    }

    // Build OAuth URL with PKCE parameters if available
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo,user',
      state: state,
    });

    // Add PKCE parameters if using PKCE flow
    if (codeChallenge) {
      authParams.append('code_challenge', codeChallenge);
      authParams.append('code_challenge_method', 'S256');
    }

    const authUrl = `https://github.com/login/oauth/authorize?${authParams.toString()}`;
    
    const response: any = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: authUrl }),
    };

    // Only set state cookie for legacy flow
    if (event.httpMethod === 'GET') {
      response.multiValueHeaders = {
        'Set-Cookie': [
          `github_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        ],
      };
    }

    return response;
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate OAuth URL" }),
    };
  }
};
