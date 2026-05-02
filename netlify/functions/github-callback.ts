import { Handler } from '@netlify/functions';

interface CallbackQueryParams {
  code?: string;
  state?: string;
}

const parseCookies = (cookieHeader: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  
  return cookies;
};

interface TokenExchangeRequest {
  code: string;
  code_verifier?: string;
}

export const handler: Handler = async (event) => {
  try {
    const { code, state } = (event.queryStringParameters || {}) as CallbackQueryParams;
    
    if (!code) {
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: ['/?oauth=error&error=no_authorization_code'],
          'Cache-Control': ['no-store'],
        },
      };
    }

    let isPKCEFlow = false;
    let codeVerifier: string | undefined;

    // Check if this is PKCE flow by checking for code_verifier in request body
    if (event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body) as TokenExchangeRequest;
        codeVerifier = body.code_verifier;
        isPKCEFlow = !!codeVerifier;
      } catch (error) {
        console.error('Failed to parse request body:', error);
      }
    }

    // For legacy flow, validate CSRF state
    if (!isPKCEFlow) {
      const cookies = parseCookies(event.headers.cookie || '');
      const storedState = cookies.github_oauth_state;
      
      if (!state || !storedState || state !== storedState) {
        console.error('CSRF state validation failed');
        return {
          statusCode: 302,
          multiValueHeaders: {
            Location: ['/?oauth=error&error=csrf_validation_failed'],
            'Cache-Control': ['no-store'],
            'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
          },
        };
      }
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId) {
      return {
        statusCode: 500,
        body: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable.",
      };
    }

    // Prepare token exchange request body
    const tokenRequestBody: any = {
      client_id: clientId,
      code: code,
    };

    // Add client_secret for non-PKCE flow or if configured
    if (clientSecret && !isPKCEFlow) {
      tokenRequestBody.client_secret = clientSecret;
    }

    // Add code_verifier for PKCE flow
    if (isPKCEFlow && codeVerifier) {
      tokenRequestBody.code_verifier = codeVerifier;
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
      console.error('GitHub token request failed:', tokenResponse.status, errorText);
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: ['/?oauth=error&error=token_request_failed'],
          'Cache-Control': ['no-store'],
          'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
        },
      };
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: [`/?oauth=error&error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`],
          'Cache-Control': ['no-store'],
          'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
        },
      };
    }

    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: ['/?oauth=error&error=no_access_token'],
          'Cache-Control': ['no-store'],
          'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
        },
      };
    }

    // Store the access token in a secure HTTP-only cookie
    return {
      statusCode: 302,
      multiValueHeaders: {
        Location: ['/?oauth=success'],
        'Cache-Control': ['no-store'],
        'Set-Cookie': [
          `github_access_token=${tokenData.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
          'github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
        ],
      },
    };
  } catch (error) {
    console.error("OAuth callback error:", error);
    return {
      statusCode: 302,
      multiValueHeaders: {
        Location: ['/?oauth=error'],
        'Cache-Control': ['no-store'],
        'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
      },
    };
  }
};
