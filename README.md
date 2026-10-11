# APIFlow Studio

[![CI](https://github.com/yashpadaliya08/apiflow/actions/workflows/ci.yml/badge.svg)](https://github.com/yashpadaliya08/apiflow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A local-first API request client and in-browser mock simulator built with React, TypeScript, Zustand, Dexie, and Express.

[Public demo](https://apiflowstudio.onrender.com/) · [Source](https://github.com/yashpadaliya08/apiflow) · [AI Catalog Manifest](https://apiflowstudio.onrender.com/ai-catalog.json) · [llms.txt](https://apiflowstudio.onrender.com/llms.txt)

## What it does

- Organize requests into collections and environments stored in browser IndexedDB.
- Run simulated responses locally, or send real HTTP requests through the backend proxy.
- Configure response examples, a supported JSON Schema subset, repeatable seeds, and mock latency.
- Evaluate status, latency, header, and body-path assertions in individual requests and collection runs.
- Import OpenAPI 3.x JSON and Postman v2.1 JSON with explicit warnings for unsupported features.
- Generate request snippets and dispatch signed Stripe, GitHub, Clerk, and Shopify webhook test events.
- Share redacted mock definitions using URL fragments and export workspace backups.
- Expose machine-discoverable capabilities for autonomous AI agents via the ARD 1.0 manifest (`/ai-catalog.json`) and `/llms.txt`.
- Serve clean comparison views at `/postman-alternative`, `/mock-api-generator`, and `/offline-api-client`.
- Code-split runtime keeping initial script evaluation fast by deferring Faker generation and editor modules until requested.

An in-browser mock is a simulation inside this app, not a remotely accessible mock server.

## Comparison with other tools

This comparison reflects only features that are currently implemented and verified in the repository:

| Capability | APIFlow Studio | Postman | Hoppscotch | Bruno |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Platform** | Web browser & PWA (Node self-host) | Desktop App & Web | Web browser & PWA (Node self-host) | Desktop App only (Electron) |
| **Mandatory Cloud Login** | **None** (100% account-free) | Required for scratchpad/runs | None (Optional cloud sync) | None (Local files) |
| **Workspace Storage** | Browser IndexedDB (Dexie) | Postman Cloud | Browser storage / optional cloud | Filesystem (`.bru` text files) |
| **In-Browser Synthetic Mocking** | **Built-in** (Faker + JSON Schema + latency simulation) | Cloud mock servers only | None | None |
| **Postman v2.1 Collection Import** | **Supported** (JSON import) | Native | Supported | Supported |
| **OpenAPI 3.x Import / Export** | **Supported** (Local JSON) | Supported | Supported | Supported |
| **Signed Webhook Dispatcher** | **Built-in** (Stripe, GitHub, Clerk, Shopify HMAC) | Manual pre-request scripts | Manual scripts | Manual scripts |
| **Live Request Execution** | Bounded backend security proxy (`POST /api/proxy`) | Desktop client / Cloud agent | Browser extension / Proxy / Cloud agent | Direct from desktop |
| **License / Pricing** | **MIT** (100% Free & Open Source) | Proprietary / Paid tiers ($14–$49/mo) | AGPL / Paid team cloud | MIT / Paid Golden Edition |

## Run locally

Use Node.js 20+ or 24 LTS and npm for production. The Docker build targets Node 24.

```sh
npm run install:all
npm run build
npm start
```

Open http://localhost:5000. For development, run `npm run dev:backend` and `npm run dev:frontend` in separate terminals.

Configuration is read from process environment variables. A plain `npm start` does not automatically load a .env file. On Node 20.6+, you can use `node --env-file=.env backend/server.js` after creating your own .env from .env.example.

- `PORT`: defaults to 5000.
- `ADMIN_KEY`: set a strong private value to enable stats authentication. Missing or placeholder keys disable admin access.
- `PUBLIC_ORIGIN`: exact browser-facing origin for admin login, especially behind HTTPS ingress. Production session cookies require HTTPS.
- `TRUSTED_PROXY_CIDRS`: explicit trusted ingress IPs/CIDRs; empty trusts no forwarded headers.
- `ALLOWED_PROXY_DOMAINS`: comma-separated domains; supports exact names and wildcard subdomains. The server default is `*`; restrict this for your deployment.

Docker: `docker compose up --build -d`. The compose configuration defaults to example-domain-only proxy access; configure your permitted API domains and admin key through environment variables or .env first.

## Privacy and transport

Collections, environments, and history are stored locally, without automatic cloud sync. Clearing browser storage deletes this data.

**Live requests are not device-only.** The destination URL, explicitly supplied headers (including credentials), and body pass through the Express backend to the destination. Use a trusted self-hosted instance for sensitive requests.

The current transport is `POST /api/proxy` with a JSON request envelope. Responses are returned as JSON data; upstream HTML is never served as an app-origin document, redirects are not followed, and app cookies are not forwarded implicitly. Private/reserved destinations are blocked. The legacy `/proxy?url=...` route returns 410; reload older clients after upgrading.

Limits: 1 MB request envelope, 5 MB upstream response, 5-second DNS deadline, 30-second upstream deadline, 20 concurrent requests, and 120 requests/minute per trusted client IP (socket peer by default). Configure only your actual ingress CIDRs to distinguish clients behind a reverse proxy. This is a bounded text/JSON relay, not a binary download, streaming, or cookie-jar client.

Admin login exchanges the key for a 30-minute HttpOnly session. Key-bearing URLs/headers and legacy raw-key cookies no longer authenticate. Read [release hardening and operator checklist](docs/release-hardening.md) before publishing. For current work, verification evidence, and IDE transfer instructions, read [HANDOFF.md](HANDOFF.md).

The application records in-memory traffic counters and latency percentiles. Distinct visitor counting salt-hashes and masks client IPs (e.g. `142.250.***.***`); raw client IPs are not stored. Platform operators can still observe network metadata. See the in-app privacy page.

Share links are readable by anyone who has them. Known credential fields are redacted, sensitive assertions and non-JSON bodies are omitted, and schema secret literals may be removed. **Review the payload preview**: automatic detection cannot recognize all sensitive information. Backups and collection exports are not redacted or encrypted; treat them as secrets.

## Compatibility and limitations

- OpenAPI: JSON 3.x with local references; external/recursive references, Swagger 2.0, and YAML require conversion or bundling. Security schemes need manual credentials. Operation-specific server overrides produce a warning.
- Postman: common raw HTTP requests, variables, headers, query/path parameters, and inherited bearer/API-key/basic auth. Scripts, OAuth flows, and non-raw bodies are not executed. Environment variables override collection variables at send time.
- Schema mocks: objects, arrays, primitive types, enum/const, explicit examples/defaults, common string formats, and basic length/numeric bounds. Advanced constraints may require an explicit response example. Integer mocks reject fractional multipleOf. This is not a full JSON Schema validator; supplied examples are used as given.
- Webhooks: this is a signed dispatcher, not a receiver. Localhost delivery is direct from the browser and requires the receiving handler's CORS configuration; remote delivery uses the public-destination proxy.
- ARD catalog: conformed to the ARD 1.0 schema (no unsupported root members) with RFC 8141 URN identifiers for autonomous agent discovery.
- Offline: after a successful production service-worker install, cached app assets and local mocks work offline. Live calls need a network connection. Admin/API responses and query-string URLs are excluded from app caching.
- Workspace backups include collections, endpoints, and environments, not execution history. Restore validates before transactional writes; matching IDs are replaced.

## Verification

```sh
npm test
npm run check
npm run build
```

Tests cover transport isolation/SSRF boundaries, single-attempt live requests, draft identity, strict assertions, webhook signatures, import fidelity, schema generation, share redaction, backup validation, service-worker exclusions, and ARD catalog root conformance (49 automated tests). They use local fixtures, not third-party APIs.

See [the reliability notes](docs/reliability.md) for upgrade details and remaining hardening work.

## License

MIT.
