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

export const handler: Handler = async (event) => {
  try {
    const { code, state } = (event.queryStringParameters || {}) as CallbackQueryParams;
    
    // Validate CSRF state
    const cookies = parseCookies(event.headers.cookie || '');
    const storedState = cookies.github_oauth_state;
    
    if (!state || !storedState || state !== storedState) {
      console.error('CSRF state validation failed');
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: ['/?oauth=error&error=csrf_validation_failed'],
          'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
        },
      };
    }

    if (!code) {
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: ['/?oauth=error&error=no_authorization_code'],
          'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
        },
      };
    }
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.",
      };
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: [`/?oauth=error&error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`],
          'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
        },
      };
    }

    // Store the access token in a secure HTTP-only cookie
    return {
      statusCode: 302,
      multiValueHeaders: {
        Location: ['/?oauth=success'],
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
        'Set-Cookie': ['github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'],
      },
    };
  }
};
