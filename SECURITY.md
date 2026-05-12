# Security Policy

## Overview

**QuickHubPulse** is a fully client-side web application. This means all operations happen directly in your browser — there is no backend server, database, or external data storage.

## Supported Versions

Only the latest version of QuickHubPulse (deployed at [quickhubpulse.netlify.app](https://quickhubpulse.netlify.app)) is actively supported.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Preferred Reporting Method:**
- Open a **private security advisory** on GitHub:  
  → [Report a vulnerability](https://github.com/TheRealFREDP3D/quickhubpulse/security/advisories/new)

Alternatively, you can email:
- `security@quickhubpulse.dev` (if available) or contact the maintainer directly via GitHub.

We will acknowledge your report within 48 hours and aim to resolve valid issues as quickly as possible.

## Security Model & Design

### Key Security Principles

- **Client-side only**: No user data or GitHub tokens are sent to any external server controlled by the application.
- **Zero data collection**: We do not collect analytics, logs, or any personal/repository data.
- **No backend**: The app runs entirely in the browser using GitHub’s official API.

### Authentication Security

- **GitHub OAuth** (Recommended): Uses secure OAuth 2.0 flow. Permissions are granted directly through GitHub.
- **Personal Access Token**: 
  - Stored **only** in your browser’s `localStorage`.
  - Never transmitted to any server other than GitHub’s API.
  - You can revoke it anytime from your GitHub settings.

### Third-Party Services

- The app communicates **only** with `api.github.com`.
- Hosted statically on **Netlify**.
- No third-party tracking, analytics, or data processing services are used.

## Scope

**In Scope:**
- Vulnerabilities in the web application (React frontend)
- Issues related to token handling and storage
- OAuth flow problems
- Cross-site scripting (XSS) or client-side injection risks

**Out of Scope:**
- GitHub API rate limiting or abuse
- Issues in your own GitHub account or repositories
- Social engineering attacks

## Disclosure Policy

We follow responsible disclosure:
- We will publicly acknowledge valid security issues after a fix is released.
- We aim to fix critical vulnerabilities within 7 days.

---

**Thank you** for helping keep QuickHubPulse secure and privacy-focused.
