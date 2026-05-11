"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/github-login-url.ts
var github_login_url_exports = {};
__export(github_login_url_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(github_login_url_exports);
var handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.URL || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Use POST with PKCE parameters." })
    };
  }
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      console.error("GITHUB_CLIENT_ID environment variable not set");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID in Netlify environment variables."
        })
      };
    }
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
    if (!siteUrl) {
      console.error("URL environment variable not set");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Site URL not configured. This should be automatically set by Netlify."
        })
      };
    }
    const redirectUri = siteUrl;
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing request body for PKCE flow" })
      };
    }
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }
    const { code_challenge, state } = body;
    if (!code_challenge || !state) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing code_challenge or state in request body" })
      };
    }
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "repo,user",
      state,
      code_challenge,
      code_challenge_method: "S256"
    });
    const authUrl = `https://github.com/login/oauth/authorize?${authParams.toString()}`;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: authUrl })
    };
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to generate OAuth URL" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=github-login-url.js.map
