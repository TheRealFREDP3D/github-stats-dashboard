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

// netlify/functions/github-callback.ts
var github_callback_exports = {};
__export(github_callback_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(github_callback_exports);
var parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
};
var handler = async (event) => {
  try {
    const { code, state } = event.queryStringParameters || {};
    if (!code) {
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: ["/?oauth=error&error=no_authorization_code"],
          "Cache-Control": ["no-store"]
        }
      };
    }
    let isPKCEFlow = false;
    let codeVerifier;
    if (event.httpMethod === "POST" && event.body) {
      try {
        const body = JSON.parse(event.body);
        codeVerifier = body.code_verifier;
        isPKCEFlow = !!codeVerifier;
      } catch (error) {
        console.error("Failed to parse request body:", error);
      }
    }
    if (!isPKCEFlow) {
      const cookies = parseCookies(event.headers.cookie || "");
      const storedState = cookies.github_oauth_state;
      if (!state || !storedState || state !== storedState) {
        console.error("CSRF state validation failed");
        return {
          statusCode: 302,
          multiValueHeaders: {
            Location: ["/?oauth=error&error=csrf_validation_failed"],
            "Cache-Control": ["no-store"],
            "Set-Cookie": ["github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"]
          }
        };
      }
    }
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId) {
      return {
        statusCode: 500,
        body: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable."
      };
    }
    const tokenRequestBody = {
      client_id: clientId,
      code
    };
    if (clientSecret && !isPKCEFlow) {
      tokenRequestBody.client_secret = clientSecret;
    }
    if (isPKCEFlow && codeVerifier) {
      tokenRequestBody.code_verifier = codeVerifier;
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
      console.error("GitHub token request failed:", tokenResponse.status, errorText);
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: ["/?oauth=error&error=token_request_failed"],
          "Cache-Control": ["no-store"],
          "Set-Cookie": ["github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"]
        }
      };
    }
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error("GitHub OAuth error:", tokenData);
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: [`/?oauth=error&error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`],
          "Cache-Control": ["no-store"],
          "Set-Cookie": ["github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"]
        }
      };
    }
    if (!tokenData.access_token) {
      console.error("No access token in response:", tokenData);
      return {
        statusCode: 302,
        multiValueHeaders: {
          Location: ["/?oauth=error&error=no_access_token"],
          "Cache-Control": ["no-store"],
          "Set-Cookie": ["github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"]
        }
      };
    }
    return {
      statusCode: 302,
      multiValueHeaders: {
        Location: ["/?oauth=success"],
        "Cache-Control": ["no-store"],
        "Set-Cookie": [
          `github_access_token=${tokenData.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
          "github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
        ]
      }
    };
  } catch (error) {
    console.error("OAuth callback error:", error);
    return {
      statusCode: 302,
      multiValueHeaders: {
        Location: ["/?oauth=error"],
        "Cache-Control": ["no-store"],
        "Set-Cookie": ["github_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"]
      }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=github-callback.js.map
