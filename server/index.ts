import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

  // OAuth endpoints
  app.post("/api/auth/github/login-url", (req, res) => {
    try {
      const { code_challenge, state } = req.body;

      if (!code_challenge || !state) {
        return res.status(400).json({ error: "Missing code_challenge or state" });
      }

      const clientId = process.env.GITHUB_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ 
          error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable." 
        });
      }

      const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:3000'}`;
      
      const authParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'repo,user',
        state: state,
        code_challenge: code_challenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `https://github.com/login/oauth/authorize?${authParams.toString()}`;
      
      res.json({ url: authUrl });
    } catch (error) {
      console.error("Error generating OAuth URL:", error);
      res.status(500).json({ error: "Failed to generate OAuth URL" });
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

      const tokenRequestBody: Record<string, string> = {
        client_id: clientId,
        code: code,
        code_verifier: code_verifier,
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
