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

// netlify/functions/exchange-token.ts
var exchange_token_exports = {};
__export(exchange_token_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(exchange_token_exports);
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
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing request body" })
      };
    }
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }
    const { code, code_verifier } = requestBody;
    if (!code || !code_verifier) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required parameters: code and code_verifier are required"
        })
      };
    }
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
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
    const tokenRequestBody = {
      client_id: clientId,
      code,
      code_verifier
    };
    if (clientSecret) {
      tokenRequestBody.client_secret = clientSecret;
    }
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tokenRequestBody)
    });
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("GitHub token exchange failed:", tokenResponse.status, errorText);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Token exchange failed"
        })
      };
    }
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error("GitHub OAuth error:", tokenData.error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: tokenData.error_description || tokenData.error
        })
      };
    }
    if (!tokenData.access_token) {
      console.error("No access token in response");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No access token received" })
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || "bearer",
        scope: tokenData.scope
      })
    };
  } catch (error) {
    console.error("Token exchange error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error during token exchange"
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=exchange-token.js.map
