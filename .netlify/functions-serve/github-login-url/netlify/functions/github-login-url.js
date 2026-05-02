"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/github-login-url.ts
var github_login_url_exports = {};
__export(github_login_url_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(github_login_url_exports);
var import_crypto = __toESM(require("crypto"), 1);
var handler = async (event) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable."
        })
      };
    }
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    if (!redirectUri) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "GitHub OAuth not configured. Please set GITHUB_REDIRECT_URI environment variable for this environment (e.g. http://localhost:3000/auth/github/callback)."
        })
      };
    }
    let codeChallenge;
    let state;
    if (event.httpMethod === "POST") {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing request body for PKCE flow" })
        };
      }
      try {
        const body = JSON.parse(event.body);
        codeChallenge = body.code_challenge;
        state = body.state;
        if (!codeChallenge || !state) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing code_challenge or state in request body" })
          };
        }
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid JSON in request body" })
        };
      }
    } else {
      state = import_crypto.default.randomBytes(16).toString("hex");
      codeChallenge = "";
    }
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "repo,user",
      state
    });
    if (codeChallenge) {
      authParams.append("code_challenge", codeChallenge);
      authParams.append("code_challenge_method", "S256");
    }
    const authUrl = `https://github.com/login/oauth/authorize?${authParams.toString()}`;
    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: authUrl })
    };
    if (event.httpMethod === "GET") {
      response.multiValueHeaders = {
        "Set-Cookie": [
          `github_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
        ]
      };
    }
    return response;
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate OAuth URL" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=github-login-url.js.map
