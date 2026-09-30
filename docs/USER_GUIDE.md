# 🖥️ APIFlow Studio — Complete User Guide & Manual

---

## 1. Overview & Architecture

**APIFlow Studio** is a browser-first, zero-setup API contract testing studio, synthetic mock engine, and live HTTP client. It eliminates the need for heavy desktop apps (like Postman or Insomnia) or cloud mock server setup.

All collections, endpoints, environments, and history are stored locally in your browser using **IndexedDB (Dexie.js)** with 100% data privacy and offline capability.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TOP NAVBAR                                │
│ Collection • Environment • Mock/Live • Templates • Runner • Code • Share│
├──────────────┬───────────────────────────┬─────────────────────────────┤
│   PANE 1     │          PANE 2           │           PANE 3            │
│              │                           │                             │
│   Sidebar    │      Request Builder      │       Response Viewer       │
│  Collection  │  Method • URL • Scenario  │   Status • Latency • Size   │
│  & Endpoints │  Params • Headers • Body  │   Pretty JSON • Diff • Tree │
│  Search•Run  │  Dynamic Faker Heuristics │   Contract Assertions (200) │
├──────────────┴───────────────────────────┴─────────────────────────────┤
│                    100% LOCAL-FIRST CLIENT (DEXIE.JS)                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Quick Start: How to Use APIFlow Studio

### Step 1: Choose Your Testing Mode
In the center of the top navbar, toggle between two execution engines:
* **⚡ Mock Engine (Client-Side)**: Simulates realistic HTTP responses directly in the browser with Faker.js heuristics (names, emails, UUIDs, dates) and 7 configurable status codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`). Zero backend required.
* **🌐 Live Proxy (Real Network)**: Dispatches real HTTP requests to any remote API or localhost service via the built-in CORS bypass proxy (`/proxy?url=...`).

---

### Step 2: Load Ready-to-Use Industry API Blueprints
Click the **✨ Templates** button in the top navbar to instantly load production-grade API collections:
1. 💳 **Stripe Billing & Payments**: Customers, PaymentIntents, Invoices, and Webhook simulation (`payment_intent.succeeded`).
2. 🤖 **OpenAI & LLM API**: `/v1/chat/completions` (GPT-4o), model listings, and 1536-dim vector embeddings.
3. 👥 **SaaS Auth & Multi-Tenant IAM**: Registration, JWT login, profile retrieval, refresh tokens, and workspace member invites.
4. 📦 **Enterprise Storefront**: Comprehensive e-commerce catalog with Auth, Users, Orders, and Products.

---

### Step 3: Fast cURL Quick Import
Have an existing API call from Chrome DevTools, documentation, or terminal?
1. Click **`Portability`** in the navbar or **`cURL`** in the sidebar.
2. Select the **`Paste cURL`** tab.
3. Paste any raw cURL command (e.g., `curl -X POST https://api.com/v1/users -H "Authorization: Bearer key" -d '{"name": "Alice"}'`).
4. Click **`Parse & Add to Collection`**. The method, path, headers, query params, and JSON body are automatically extracted and selected.

---

### Step 4: Execute & Inspect Responses
1. Click the primary **`Simulate`** (or **`Send`**) button, or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (<kbd>Cmd</kbd> + <kbd>Enter</kbd>).
2. The right-hand **Response Viewer** displays:
   * **Status Badge**: HTTP code with status text (e.g. `200 OK`).
   * **Visual Contract Match**: Automatically checks if the response code matches your expected contract scenario (`Contract Match (200)` in green or `Deviates` in amber).
   * **Latency & Payload Size**: Accurate execution timing in milliseconds and size in kB.
   * **Pretty JSON Tree / Raw View**: Formatted syntax with indentation.
   * **Headers Inspector**: Full table of response headers.

---

### Step 5: Visual Response Diff / Comparison
Want to see how your Live response compares with your Mock contract, or how consecutive requests differ?
1. Run your request once in **Mock Engine** mode.
2. Switch to **Live Proxy** mode and run again (or edit your parameters and re-send).
3. Click the **`Diff / Compare`** tab in the Response Viewer.
4. View an instant, colored line-by-line comparison:
   * Green lines ($+$) indicate added or modified fields.
   * Red lines ($-$) indicate removed fields.
   * Gray lines indicate unchanged schema properties.

---

### Step 6: 1-Click Interactive Mock Link Sharing
Need to share a working mock API with a frontend teammate or in a GitHub PR without forcing them to install an app or create an account?
1. Select any endpoint.
2. Click the **`Share`** button in the top navbar or next to the Send button.
3. Click **`Copy Link`**.
   * Example: `https://your-domain.com/?mock=eyJtZXRob2QiOiJQT1NUIiwicGF0aCI...`
4. **How it works:** When your teammate opens the link, APIFlow automatically decodes the payload, saves it into their local workspace, and opens it ready for testing.
5. Click **`Copy Badge`** to embed a 1-click test badge directly into your GitHub `README.md` or PR description:
   ```markdown
   [![Test Mock in APIFlow](https://img.shields.io/badge/APIFlow-Test_Mock-6366F1?style=flat-square&logo=fastapi)](https://your-domain.com/?mock=...)
   ```

---

### Step 7: Automated Collection Test Runner
Need to test an entire API suite before shipping?
1. Click the **`Runner`** button in the navbar or the **`Run`** button in the sidebar.
2. Choose your execution mode (**Mock Engine** or **Live Proxy**).
3. Set your pacing delay (`0ms Instant`, `50ms`, `150ms`, `300ms`).
4. Click **`Start Run`**.
5. Watch the live progress bar and table execute every endpoint sequentially:
   * Displays HTTP method, endpoint path, expected vs actual status code, latency, and real-time **PASS / FAIL** indicators.
6. When complete, view the summary KPIs (Total Run, Passed, Failed, Average Latency) and click **`Copy Markdown Report`** to paste the test execution report into a GitHub PR or QA sign-off document.

---

### Step 8: Environment Variables (`{{variable}}`)
1. Click the environment badge in the top navbar (e.g. `Development`).
2. Add key-value variables:
   * `baseUrl`: `https://api.stripe.com`
   * `token`: `eyJhbGciOi...`
   * `apiVersion`: `v1`
3. In any path, header, query parameter, or request body, reference variables using double braces:
   * `{{baseUrl}}/v1/users/{{userId}}`
   * Header: `Authorization: Bearer {{token}}`
4. APIFlow replaces variables on the fly during execution.

---

### Step 9: Contract Portability (OpenAPI 3.1 & Postman)
1. Click **`Portability`** in the top navbar.
2. **Export**: 1-click download of your active collection as **OpenAPI 3.1.0 JSON** (compatible with Swagger UI, Readme, Speakeasy) or **Postman Collection v2.1.0**.
3. **Import**: Upload or paste any raw OpenAPI JSON/YAML or Postman v2.1 collection to instantly import it into your workspace.

---

### Step 10: Private Admin Telemetry & Real-Time Stats
Server visitor metrics, real-time analytics, and referral sources are strictly protected:
* **Admin Shortcut**: Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> (<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd>) to toggle the Analytics modal.
* **Passkey Gateway**: Open `/stats` on your server in a browser. It will ask for your passkey (`apiflow-admin-2026`). Once entered, it unlocks a 7-day session cookie and displays the live analytics dashboard.

---

## 3. Keyboard Shortcuts Reference

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> / <kbd>Cmd</kbd> + <kbd>Enter</kbd> | Execute Request (Simulate or Send) | Studio Editor |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> | Toggle Admin Analytics Modal | Global |
| <kbd>Ctrl</kbd> + <kbd>C</kbd> (in Response) | Copy Formatted Response Body | Response Viewer |
