import { Handler } from '@netlify/functions';

interface TokenExchangeRequest {
  code: string;
  code_verifier: string;
  state?: string;
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    let requestBody: TokenExchangeRequest;
    try {
      requestBody = JSON.parse(event.body) as TokenExchangeRequest;
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    const { code, code_verifier } = requestBody;

    if (!code || !code_verifier) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters: code and code_verifier are required' 
        }),
      };
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
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

    // Build token exchange request with PKCE
    const tokenRequestBody: Record<string, string> = {
      client_id: clientId,
      code: code,
      code_verifier: code_verifier,
    };

    // Add client_secret for additional security (recommended by GitHub)
    if (clientSecret) {
      tokenRequestBody.client_secret = clientSecret;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let tokenResponse: Response;
    try {
      tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenRequestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[Token Exchange] Request timeout');
        return {
          statusCode: 408,
          headers,
          body: JSON.stringify({ 
            error: 'Token exchange request timeout - please try again' 
          }),
        };
      }
      
      throw error;
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('GitHub token exchange failed:', tokenResponse.status, errorText);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Token exchange failed'
        }),
      };
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData.error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: tokenData.error_description || tokenData.error 
        }),
      };
    }

    if (!tokenData.access_token) {
      console.error('No access token in response');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No access token received' }),
      };
    }

    // Return success response with token info
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'bearer',
        scope: tokenData.scope,
      }),
    };

  } catch (error) {
    console.error('Token exchange error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error during token exchange' 
      }),
    };
  }
};
