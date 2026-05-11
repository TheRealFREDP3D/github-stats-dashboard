## Transparency & Security Disclosures

**QuickHubPulse** is a fully client-side web application with strong emphasis on user privacy and security.

### Data Handling & Privacy
- **No data collection**: The app does not collect, store, or transmit any user data to external servers.
- **Client-side only**: All operations (fetching repository data, rendering charts, filtering, etc.) happen entirely in your browser.
- **Authentication**: 
  - **GitHub OAuth** (recommended): Uses secure OAuth flow. No long-lived tokens are stored by the app beyond GitHub’s standard session handling.
  - **Personal Access Token**: Stored only in your browser’s localStorage. Never sent to any third-party server.
- **No analytics or tracking**: No Google Analytics, Mixpanel, Sentry, or any third-party tracking tools are used.

### Permissions & Access
The app only requests the minimum GitHub permissions needed:
- `repo` scope (to read repositories, issues, PRs, and traffic data)
- `read:org` scope (to access organization repositories you belong to)

You can revoke access at any time directly from your [GitHub settings](https://github.com/settings/applications).

### Compliance
- **Not an AI system**: This application does not use artificial intelligence, machine learning, or automated decision-making. Therefore, it is out of scope of the EU AI Act (Articles 6 and 8–17).
- **GDPR / Data Privacy**: Since no personal data is collected or processed on any server, there is no GDPR processing activity by the app.
- **Open Source**: The full source code is available on [GitHub](https://github.com/TheRealFREDP3D/quickhubpulse) for public audit.

### Security Practices
- Regularly updated dependencies
- No backend or database
- Token handling follows GitHub security recommendations
- Hosted on Netlify with modern security headers

**Contact**: For security concerns or questions, please open an issue on the GitHub repository.

---

**We believe in radical transparency** — you can verify everything yourself by reviewing the public source code.