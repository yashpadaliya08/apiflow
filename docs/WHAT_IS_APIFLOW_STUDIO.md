# 📖 What Is APIFlow Studio?

> **The Lightweight, Browser-First API Testing Studio, Contract Simulator & Synthetic Mock Engine.**

---

## 1. The Core Problem

In modern software development, **frontend engineers are perpetually blocked waiting for backend APIs to be designed, deployed, and configured**.

- **Traditional mock servers** (e.g. `json-server`, WireMock, Prism) require terminal setup, configuration files, npm daemon processes, or cloud accounts.
- **Enterprise API clients** (e.g. Postman, Insomnia) have become bloated with paid cloud subscriptions, mandatory logins, heavy electron memory footprints (800MB+ RAM), and cloud-locked mock servers.
- **Contract misalignment**: Frontend teams build with placeholder data that does not match real production structures (missing UUIDs, realistic timestamps, RFC status headers, or realistic error schemas).

---

## 2. The Solution: APIFlow Studio

**APIFlow Studio** is a standalone, client-side developer studio that runs completely inside the browser with **zero backend setup required**:

1. **Instant Mock Execution (100% In-Browser)**: Simulates 7 realistic HTTP responses (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Server Error`) with realistic server latency (15–40ms jitter) and RFC-standard headers.
2. **Schema-Driven Synthetic Engine**: Uses regex-based field heuristics powered by `@faker-js/faker` to generate authentic names, avatars, JWT bearer tokens, prices, dates, and order IDs automatically.
3. **Dual Execution Mode**:
   - **Mode A (Synthetic Mock Engine)**: Zero backend, zero cloud, 100% offline-ready in the browser.
   - **Mode B (Live Proxy Gateway)**: Transparently forwards requests to external staging or production APIs, bypassing browser CORS restrictions via a lightweight Express proxy.
4. **1-Click Code Generation**: Exports ready-to-run snippets in **cURL**, **TypeScript (`fetch`)**, **Axios**, and **Python (`requests`)**.
5. **Contract Portability**: Full two-way support for **OpenAPI 3.1.0** and **Postman Collection v2.1** with 1-click JSON file downloads.
6. **Local Browser Persistence**: Stores all collections, environments, and execution history locally using **Dexie.js IndexedDB** — your data never leaves your device.
7. **Zero-Cost Phone & PC Hosting**: Ready for **StackDoctor** deployment to run 24/7 on an old Android phone via Termux or on a local machine with Cloudflare Tunnels.

---

## 3. How APIFlow Compares to Existing Tools

| Feature | Postman | Mockoon | json-server | APIFlow Studio |
|---|---|---|---|---|
| **Zero Backend Requirement** | ❌ (Needs cloud mock) | ⚠️ (Desktop app) | ❌ (Node process) | ✅ **100% In-Browser** |
| **Memory Footprint** | 800 MB+ (Electron) | 350 MB+ (Electron) | ~120 MB (Node) | ⚡ **< 30 MB (Browser Tab)** |
| **Synthetic Faker Heuristics** | ⚠️ (Manual scripting) | ⚠️ (Handlebars) | ❌ (Static file) | ✅ **Auto Field Heuristics** |
| **Dual Execution (Mock + Live)** | ✅ (Cloud proxy) | ❌ (Mocks only) | ❌ (Mocks only) | ✅ **Built-in CORS Gateway** |
| **OpenAPI 3.1 & Postman 2.1** | Postman format only | ⚠️ Partial | ❌ None | ✅ **Full 2-Way Import/Export** |
| **Data Privacy** | ❌ Cloud synced | ✅ Local | ✅ Local | ✅ **100% Local (IndexedDB)** |
| **Zero-Cost Phone Hosting** | ❌ Impossible | ❌ Desktop only | ⚠️ CLI only | ✅ **Optimized for Termux** |
| **Account Required** | ❌ Mandatory Login | ✅ No login | ✅ No login | ✅ **Zero Login / Instant Access** |

---

## 4. Key Target Audiences

- **Frontend Engineers**: Prototype UI components and forms immediately against realistic mock APIs without waiting for backend sprints.
- **QA & Automation Testers**: Validate error handling by simulating `401 Unauthorized`, `404 Not Found`, and `500 Server Error` edge cases on demand.
- **Backend Developers & Architects**: Draft API contracts, test payload shapes, and export standard OpenAPI 3.1 specifications.
- **Students & Indie Hackers**: Test external APIs without running into CORS barriers or paying for expensive cloud infrastructure.
