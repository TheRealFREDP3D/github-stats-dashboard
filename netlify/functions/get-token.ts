import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Get the access token from cookies
    const cookies = parseCookies(event.headers.cookie || '');
    const accessToken = cookies.github_access_token;

    if (!accessToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No access token found' }),
      };
    }

    // Return the token to the frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    };
  } catch (error) {
    console.error('Error retrieving token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve token' }),
    };
  }
};

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
