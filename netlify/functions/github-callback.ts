import { Handler } from '@netlify/functions';

export const handler: Handler = async (event: any) => {
  try {
    const { code, state } = event.queryStringParameters || {};
    
    if (!code) {
      return {
        statusCode: 400,
        body: "Authorization code not provided",
      };
    }

    // Exchange the code for an access token
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
        headers: {
          Location: `/?oauth=error&error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`,
        },
      };
    }

    // Redirect to frontend with the access token
    return {
      statusCode: 302,
      headers: {
        Location: `/?oauth=success&access_token=${tokenData.access_token}&state=${state}`,
      },
    };
  } catch (error) {
    console.error("OAuth callback error:", error);
    return {
      statusCode: 302,
      headers: {
        Location: `/?oauth=error`,
      },
    };
  }
};
