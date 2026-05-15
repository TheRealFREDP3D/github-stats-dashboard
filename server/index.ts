import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "..", "data");
const STATS_FILE = path.resolve(DATA_DIR, "repository-stats.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // Helper to get the correct redirect URI
  const getRedirectUri = () => {
    if (process.env.GITHUB_REDIRECT_URI) {
      return process.env.GITHUB_REDIRECT_URI;
    }
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    // Append /auth/github/callback for the legacy flow handled by this server
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/auth/github/callback`;
  };

  // OAuth endpoints
  // Support both GET (legacy/simple) and POST (modern PKCE)
  app.all("/api/auth/github/login-url", (req, res) => {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ 
          error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable." 
        });
      }

      // Defensive check for production environment
      if (!process.env.GITHUB_REDIRECT_URI && !process.env.BASE_URL && process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          error: "OAuth redirect URL not configured. Please set GITHUB_REDIRECT_URI or BASE_URL environment variables."
        });
      }

      const redirectUri = getRedirectUri();
      
      const authParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'repo,user',
      });

      // Handle PKCE parameters if provided via POST
      if (req.method === 'POST') {
        const { code_challenge, state } = req.body;
        if (code_challenge) {
          authParams.append('code_challenge', code_challenge);
          authParams.append('code_challenge_method', 'S256');
        }
        if (state) authParams.append('state', state);
      } else {
        // Simple state for GET requests if not provided
        const state = req.query.state as string || Math.random().toString(36).substring(2, 15);
        authParams.append('state', state);
      }

      const authUrl = `https://github.com/login/oauth/authorize?${authParams.toString()}`;
      
      res.json({ url: authUrl });
    } catch (error) {
      console.error("Error generating OAuth URL:", error);
      res.status(500).json({ error: "Failed to generate OAuth URL" });
    }
  });

  // Legacy OAuth callback handler - redirects to root
  app.get("/auth/github/callback", (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) {
        return res.status(400).send("Authorization code not provided");
      }
      res.redirect(`/?oauth=success&code=${code}&state=${state}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect(`/?oauth=error`);
    }
  });

  // Token exchange endpoint for PKCE
  app.post("/api/auth/exchange-token", async (req, res) => {
    try {
      const { code, code_verifier } = req.body;

      if (!code || !code_verifier) {
        return res.status(400).json({
          error: 'Missing required parameters: code and code_verifier are required'
        });
      }

      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId) {
        return res.status(500).json({
          error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable."
        });
      }

      const redirectUri = getRedirectUri();

      const tokenRequestBody: Record<string, string> = {
        client_id: clientId,
        code: code,
        code_verifier: code_verifier,
        redirect_uri: redirectUri,
      };

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
        return res.status(400).json({ error: 'Token exchange failed' });
      }

      const tokenData = await tokenResponse.json() as any;

      if (tokenData.error) {
        return res.status(400).json({
          error: tokenData.error_description || tokenData.error
        });
      }

      res.json({
        success: true,
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'bearer',
        scope: tokenData.scope,
      });
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Internal server error during token exchange' });
    }
  });

  // Save repository stats
  app.post("/api/stats", (req, res) => {
    try {
      ensureDataDir();
      const stats = req.body;
      const timestamp = new Date().toISOString();

      let existingData: { timestamp: string; stats: unknown }[] = [];
      if (fs.existsSync(STATS_FILE)) {
        const content = fs.readFileSync(STATS_FILE, "utf-8");
        existingData = JSON.parse(content);
      }

      existingData.push({ timestamp, stats });
      fs.writeFileSync(STATS_FILE, JSON.stringify(existingData, null, 2));

      res.json({ success: true, timestamp });
    } catch (err) {
      console.error("Error saving stats:", err);
      res.status(500).json({ success: false, error: "Failed to save stats" });
    }
  });

  // Get all historical stats
  app.get("/api/stats", (_req, res) => {
    try {
      if (!fs.existsSync(STATS_FILE)) {
        return res.json([]);
      }
      const content = fs.readFileSync(STATS_FILE, "utf-8");
      res.json(JSON.parse(content));
    } catch (err) {
      console.error("Error reading stats:", err);
      res.status(500).json({ success: false, error: "Failed to read stats" });
    }
  });

  // Get latest stats
  app.get("/api/stats/latest", (_req, res) => {
    try {
      if (!fs.existsSync(STATS_FILE)) {
        return res.json(null);
      }
      const content = fs.readFileSync(STATS_FILE, "utf-8");
      const data = JSON.parse(content);
      res.json(data[data.length - 1] || null);
    } catch (err) {
      console.error("Error reading latest stats:", err);
      res.status(500).json({ success: false, error: "Failed to read stats" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
