<div align="center">

# 🚀 APIFlow Studio

### The Offline-First, Zero-Cloud Postman Alternative & In-Browser Mock Simulator

[![Live Demo](https://img.shields.io/badge/Live_Demo-apiflowstudio.onrender.com-10B981?style=for-the-badge&logo=render&logoColor=white)](https://apiflowstudio.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](https://opensource.org/licenses/MIT)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](./docker-compose.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-6366F1?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yashpadaliya08/apiflow/pulls)

<p align="center">
  <b>Private by Design</b> • <b>Faker-Driven In-Browser Mock Engine</b> • <b>Pure IndexedDB Storage</b><br>
  <b>Built-in CORS Proxy Gateway</b> • <b>OpenAPI 3.1 & Postman 2.1 Portability</b> • <b>1-Click Docker Self-Hosting</b>
</p>

👉 **[Try Live Demo in your Browser (No Sign-up)](https://apiflowstudio.onrender.com)** 👈

---

![APIFlow Studio Preview](assets/preview.png)

</div>

---

## ⚡ Why APIFlow Studio?

Most API testing tools now require **mandatory cloud logins**, sync private API keys and company tokens to remote servers, and gate basic mock servers behind subscription paywalls.

**APIFlow Studio** is built from the ground up to be **100% private, offline-first, and zero-cloud**:

* 🔒 **Zero Cloud Lock-in & Privacy First:** All collections, environments, and execution history are stored on your local machine in **IndexedDB** (via Dexie.js). Your API tokens, cookies, and secrets never leave your device.
* ⚡ **Browser-Native Synthetic Mock Engine:** Simulate realistic `200`, `201`, `400`, `401`, `403`, `404`, and `500` HTTP status codes with custom latency. Built-in **@faker-js/faker** heuristics detect field names (`userId`, `email`, `createdAt`, `avatar`) to generate realistic schemas on the fly without running any backend.
* 🌐 **Built-in CORS Proxy Relay:** Call external third-party APIs directly from your browser without encountering browser CORS preflight errors.
* 📦 **Universal Specification Interoperability:** Seamlessly import and export official **OpenAPI 3.1.0**, **Swagger**, and **Postman Collection v2.1** formats.
* 🐳 **Self-Host in 1 Command:** Deploy anywhere with Docker Compose — homelabs, private VPS, or on local dev machines.

---

## 📊 Feature Comparison

| Feature | APIFlow Studio | Postman | Insomnia | Hoppscotch | Mockoon |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Mandatory Cloud Login** | ❌ **None (Zero Login)** | ⚠️ Yes | ⚠️ Yes | ⚠️ Partial | ❌ None |
| **Data Storage Location** | 🔒 **100% Local (IndexedDB)** | ☁️ Cloud Sync | ☁️ Cloud / Local | ☁️ Cloud / Local | 💻 Local Disk |
| **Client-Side Synthetic Mocking** | ✅ **Built-in (7 Statuses)** | ⚠️ Cloud Runner | ❌ Manual | ❌ No | ✅ Desktop App |
| **Faker Heuristic Schemas** | ✅ **Automatic** | ❌ Manual | ❌ Manual | ❌ No | ⚠️ Template syntax |
| **Built-in CORS Bypass Proxy** | ✅ **Included** | ❌ Desktop Agent | ❌ No | ⚠️ Node Proxy | ❌ Desktop Only |
| **1-Click Interactive Mock Link** | ✅ **`?mock=...` URLs** | ❌ Requires Cloud | ❌ No | ❌ No | ❌ No |
| **OpenAPI 3.1 & Postman 2.1 Import** | ✅ **Native** | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| **Code Snippet Generator** | ✅ **cURL, Fetch, Axios, Python** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **License** | 📜 **MIT (Free & Open Source)** | Proprietary | Proprietary | AGPL v3 | GPL v3 |

---

## 🌟 Key Features

### 1. In-Browser Synthetic Mock Engine
* Simulate real API scenarios instantly before backend engineers even finish building endpoints.
* Supports status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Error`.
* Configurable simulated network latency (0ms to 2000ms).

### 2. Dual Execution Mode
* **Mock Mode:** Executes purely within the browser tab using Faker schemas. Zero network requests, zero server dependencies.
* **Live Mode:** Routes real network calls through the built-in Express CORS proxy gateway (`/proxy?url=...`).

### 3. Collection Test Runner
* Automated sequential test runner that validates status codes, response headers, schema contracts, and SLA latencies across entire collections.
* Real-time pass/fail telemetries and 1-click Markdown test report export.

### 4. Simulated Webhook Dispatcher
* Simulate incoming webhook events from **Stripe**, **GitHub**, **Clerk**, and **Shopify** with cryptographic signature headers (`Stripe-Signature`, `X-Hub-Signature-256`, `svix-signature`) sent directly to your local handler (e.g. `http://localhost:3000/api/webhook`).

### 5. Multi-Language Code Snippet Generator
* Generate ready-to-paste production code with one click:
  * **cURL** (command line)
  * **TypeScript Fetch**
  * **Axios** (Node / Browser)
  * **Python Requests**

### 6. Keyboard Shortcuts for Power Users
* <kbd>Ctrl</kbd> + <kbd>Enter</kbd> — Execute active request immediately
* <kbd>/</kbd> — Focus endpoint search bar
* <kbd>?</kbd> — Open 7-step interactive onboarding walkthrough

---

## ⚡ Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/yashpadaliya08/apiflow.git
cd apiflow

# 2. Launch containerized studio
docker compose up -d

# 3. Open in browser
# http://localhost:5000
```

### Option 2: Local Node.js

```bash
# 1. Clone repository
git clone https://github.com/yashpadaliya08/apiflow.git
cd apiflow

# 2. Install dependencies & start server
npm install
npm run build
npm start

# 3. Open in browser
# http://localhost:5000
```

### Option 3: Development Mode (Vite Hot-Reload)

```bash
# Terminal 1: Start Backend CORS Proxy
npm run dev:backend

# Terminal 2: Start Frontend Dev Server
npm run dev:frontend

# Open Vite dev server:
# http://localhost:5173
```

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                   APIFlow Studio                       │
├──────────────────────────┬─────────────────────────────┤
│ Frontend (Browser Tab)   │ Backend / Gateway           │
│ • React 18 + TypeScript  │ • Node.js + Express 5       │
│ • Vite 6 + Tailwind CSS  │ • Lightweight CORS Proxy    │
│ • Dexie.js (IndexedDB)   │ • SSRF Protection & DNS     │
│ • @faker-js/faker Engine │ • Response Gzip Compression │
│ • Lucide Icons           │ • Prometheus / Health Route │
└──────────────────────────┴─────────────────────────────┘
```

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Dexie.js, CodeMirror.
* **Backend:** Express 5, CORS proxy relay with SSRF private network guards.
* **Storage:** 100% Client-side IndexedDB — zero server database required.

---

## 📚 Documentation Suite

Comprehensive guides are available in the [**`docs/`**](./docs/) directory:

* 📖 [**What is APIFlow Studio?**](./docs/WHAT_IS_APIFLOW_STUDIO.md) — Product philosophy, problem solved, and architecture deep-dive.
* ⚡ [**Product Guide & Specifications**](./docs/PRODUCT_GUIDE.md) — Faker heuristics, HTTP status schemas, and IndexedDB schema design.
* 🖥️ [**User Interface Guide**](./docs/USER_GUIDE.md) — 3-pane layout, shortcut keys, and theme system.
* 📘 [**User Manual**](./docs/USER_MANUAL.md) — Managing collections, environments, headers, request bodies, and mock scenarios.
* 🎓 [**Step-by-Step Tutorials**](./docs/STEP_BY_STEP_TUTORIALS.md) — Practical workflows from frontend prototyping to contract handoff.
* 📱 [**Deployment & Hosting Guide**](./docs/DEPLOYMENT_AND_HOSTING_GUIDE.md) — Homelab Docker setup, VPS guides, and spare phone hosting via Termux.

---

## 🤝 Contributing

Contributions are warmly welcome! Whether it's adding new mock heuristics, blueprint templates, or fixing bugs:

1. Fork the Project (`https://github.com/yashpadaliya08/apiflow`)
2. Create your Feature Branch (`git checkout -b feat/amazing-feature`)
3. Commit your Changes (`git commit -m "feat: add amazing feature"`)
4. Push to the Branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 👤 Author

**Yash Padaliya**
* GitHub: [@yashpadaliya08](https://github.com/yashpadaliya08)
* LinkedIn: [in/padaliya-yash](https://www.linkedin.com/in/padaliya-yash/)

---

## 📄 License

This project is open source and available under the [**MIT License**](./LICENSE).
