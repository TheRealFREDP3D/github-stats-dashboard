# Development Authentication with GitHub Personal Access Token

This feature allows you to authenticate with GitHub using a Personal Access Token instead of OAuth during development.

## Setup Instructions

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "QuickHubPulse Dev")
4. Select the following scopes:
   - `public_repo` (Access public repositories)
   - `read:user` (Read user profile data)
5. Click "Generate token"
6. **Important:** Copy the token immediately as you won't be able to see it again

### 2. Configure the Token

Add your token to your `.env` file:

```bash
VITE_GITHUB_PERSONAL_TOKEN=your_personal_access_token_here
```

### 3. Run the Development Server

```bash
pnpm run dev
```

## How It Works

### Automatic Authentication
- If you have `VITE_GITHUB_PERSONAL_TOKEN` set in your `.env` file, the app will automatically authenticate using that token when you start the development server
- You'll see a success message indicating you're authenticated with the development token

### Manual Token Input
- If no token is configured in the environment, you'll see a "Development Mode" section on the login page
- You can manually enter your Personal Access Token there
- The token will be stored in session storage for convenience

### OAuth Fallback
- If you prefer to use OAuth or don't have a Personal Access Token, you can still use the regular "Sign in with GitHub" button
- The app will use the OAuth PKCE flow as before

## Security Notes

- **Never commit your Personal Access Token to version control**
- Personal Access Tokens should only be used for development
- In production, the app uses OAuth with PKCE for secure authentication
- Tokens are stored in session storage (cleared when the browser tab is closed)

## Token Validation

The app validates tokens by:
1. Checking the token format (must be 40+ characters)
2. Making a test API call to GitHub to verify the token is valid
3. Checking that the token has the required permissions

## Troubleshooting

### "Invalid token format" error
- Ensure your token is at least 40 characters long
- Make sure you're using a Personal Access Token, not an OAuth token

### "Token lacks required permissions" error
- Make sure your token has the `public_repo` and `read:user` scopes
- Regenerate the token with the correct scopes if needed

### "Invalid or expired token" error
- Check that the token is copied correctly
- Generate a new token if the current one has expired

## Switching Between Auth Methods

You can switch between authentication methods by:
1. Removing the token from `.env` to use OAuth
2. Adding a token to `.env` to use Personal Access Token authentication
3. Using the manual token input for temporary authentication

The app will automatically detect which method to use based on your configuration.
