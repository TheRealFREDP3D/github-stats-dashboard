# GitHub OAuth Setup Guide

This project uses GitHub OAuth with PKCE (Proof Key for Code Exchange) for secure authentication. This guide walks you through setting up a GitHub OAuth App and configuring it with your Netlify deployment.

## Prerequisites

- A GitHub account
- A Netlify account
- Admin access to the Netlify project

## Step 1: Create GitHub OAuth App

1. Go to [GitHub OAuth Applications](https://github.com/settings/applications/new)
2. Fill in the application details:
   - **Application name**: QuickHubPulse (or your preferred name)
   - **Homepage URL**: Your Netlify site URL (e.g., `https://quickhubpulse.netlify.app`)
   - **Application description**: Optional
   - **Authorization callback URL**: Your Netlify site URL (e.g., `https://quickhubpulse.netlify.app`)
     > **Important**: The callback URL should be the ROOT of your site, not a specific path. The PKCE flow handles the callback at the root.
3. Click "Register application"
4. Copy the **Client ID**
5. Click "Generate a new client secret" and copy the **Client Secret** (you won't be able to see it again)

## Step 2: Configure Netlify Environment Variables

1. Go to your Netlify project dashboard
2. Navigate to **Site configuration** > **Environment variables**
3. Add the following environment variables:
   - `GITHUB_CLIENT_ID`: The Client ID from Step 1
   - `GITHUB_CLIENT_SECRET`: The Client Secret from Step 1

> **Note**: The redirect URI is automatically set to your Netlify site URL (provided by Netlify's `URL` environment variable), so you don't need to configure it separately.

## Step 3: Deploy and Test

1. Deploy your changes to Netlify
2. Navigate to your site
3. Click "Sign in with GitHub"
4. You should be redirected to GitHub's authorization page
5. Authorize the app
6. You should be redirected back to your site and automatically logged in

## How the PKCE Flow Works

1. User clicks "Sign in with GitHub"
2. Client generates a cryptographic `code_verifier` and `code_challenge` (SHA-256 hash)
3. Client requests authorization URL from Netlify function with `code_challenge`
4. Netlify function builds GitHub OAuth URL with PKCE parameters
5. User is redirected to GitHub to authorize the app
6. GitHub redirects back to your site with an authorization `code`
7. Client sends `code` and `code_verifier` to Netlify function
8. Netlify function exchanges the code + verifier for an access token
9. Access token is returned to the client for authenticated API calls

## OAuth Scopes

Current scopes configured:
- `repo`: Access to public and private repositories
- `user`: Access user profile data

You can modify these scopes in `netlify/functions/github-login-url.ts` based on your application needs.

## Troubleshooting

### "GitHub OAuth not configured"

- Ensure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in Netlify environment variables
- Redeploy the site after adding environment variables

### "GitHub access was denied"

- User may have denied authorization
- Try authorizing again

### "Redirect URI mismatch"

- Ensure the Authorization callback URL in GitHub OAuth App settings matches your Netlify site URL exactly
- The URL should be the root (e.g., `https://your-site.netlify.app`), not a subpath

### "Invalid OAuth state"

- The PKCE state validation failed
- This can happen if the browser session was cleared mid-flow
- Try signing in again

### Network errors

- Check your internet connection
- Check Netlify function logs for errors in the Netlify dashboard

## Security Best Practices

- **Never commit credentials** to version control
- **Use environment variables** for all secrets
- **PKCE flow** protects against authorization code interception attacks
- **Rotate secrets regularly** in GitHub OAuth App settings
- **Monitor OAuth App usage** in GitHub dashboard

## Documentation

- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth Security Implementation](./oauth-security.md)
