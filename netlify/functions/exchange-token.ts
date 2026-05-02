import { Handler } from '@netlify/functions';

interface TokenExchangeRequest {
  code: string;
  code_verifier: string;
  state?: string;
}

export const handler: Handler = async (event) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    let requestBody: TokenExchangeRequest;
    try {
      requestBody = JSON.parse(event.body) as TokenExchangeRequest;
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    const { code, code_verifier, state } = requestBody;

    if (!code || !code_verifier) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required parameters: code and code_verifier are required' 
        }),
      };
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable." 
        }),
      };
    }

    // Exchange authorization code for access token using PKCE
    const tokenRequestBody: any = {
      client_id: clientId,
      code: code,
      code_verifier: code_verifier,
    };

    // Add client_secret if available (optional for PKCE but recommended)
    if (clientSecret) {
      tokenRequestBody.client_secret = clientSecret;
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequestBody),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('GitHub token exchange failed:', tokenResponse.status, errorText);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Token exchange failed',
          details: errorText 
        }),
      };
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: tokenData.error_description || tokenData.error 
        }),
      };
    }

    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No access token received' }),
      };
    }

    // Return success response with token info
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
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
      body: JSON.stringify({ 
        error: 'Internal server error during token exchange' 
      }),
    };
  }
};
