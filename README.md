# 🚀 APIFlow Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](./docker-compose.yml)
[![Offline First](https://img.shields.io/badge/Offline--First-100%25-10B981)](#-offline-first-by-design)
[![Zero Cloud](https://img.shields.io/badge/Zero--Cloud-Pure_IndexedDB-6366F1)](#-why-apiflow-studio)

> **The Offline-First, Zero-Cloud API Testing Studio, Contract Simulator & Mock Runner.**  
> *Private by Design • In-Browser Synthetic Mocking • Pure IndexedDB Storage • Docker & Homelab Ready • OpenAPI 3.1 & Postman 2.1 Portability • 100% Free & Open Source (MIT)*

---

## 💡 Why APIFlow Studio?

Tired of API tools that force you into cloud accounts, sync your private API keys and tokens to third-party servers, and require cloud mock instances just to simulate a simple response?

**APIFlow Studio is built around three core principles:**

1. **🔒 100% Offline-First & Private:** Everything persists locally inside your browser's **IndexedDB** (via Dexie.js). No mandatory logins, no workspace team limits, no cloud tracking, and your secrets never leave your device.
2. **⚡ Instant In-Browser Mock Simulation:** Test scenarios without waiting for backend APIs to be built. Simulate `200`, `201`, `400`, `401`, `403`, `404`, and `500` HTTP status codes with realistic latency and intelligent Faker-driven schemas right inside the browser.
3. **🏠 Self-Host Anywhere:** Run in your homelab, on a VPS, or even an old spare phone using our 1-command Docker Compose stack.

---

## ⚡ Quick Start

### Option 1: Docker Compose (Recommended for Homelab & Self-Hosting)

```bash
# 1. Clone repository
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
node backend/server.js

# 3. Open in browser
# http://localhost:5000
```

---

## 📊 Comparison: APIFlow Studio vs Others

| Feature | APIFlow Studio | Postman | Insomnia | Mockoon |
|:---|:---:|:---:|:---:|:---:|
| **Mandatory Cloud Login** | ❌ **None (Zero Login)** | ⚠️ Yes | ⚠️ Yes | ❌ None |
| **Data Storage Location** | 🔒 **100% Local (IndexedDB)** | ☁️ Cloud Sync | ☁️ Cloud / Local | 💻 Local Disk |
| **Instant Client Mock Engine** | ✅ **Built-in (7 Statuses)** | ⚠️ Cloud Runner | ❌ Manual | ✅ Desktop App |
| **Self-Hostable in Homelab** | ✅ **1-Click Docker** | ❌ Proprietary | ❌ No | ⚠️ CLI Runner |
| **OpenAPI 3.1 Import/Export** | ✅ **Native** | ⚠️ Limited | ⚠️ Partial | ⚠️ Partial |
| **Postman v2.1 Migration** | ✅ **1-Click Import** | Native | ⚠️ Partial | ⚠️ Partial |
| **License** | 📜 **MIT (Free & Open Source)** | Proprietary | Proprietary | GPL v3 |

---

## 🌟 Key Features

* **Browser-Native Synthetic Mocks:** Instant simulation of `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, and `500 Server Error` with configurable network latency.
* **Intelligent Faker Heuristics Engine:** Generates realistic UUIDs, names, emails, timestamps, enterprise entities, and JWT tokens automatically based on schema and field names.
* **Dual Execution Mode:**
  * **Simulation Mode:** Fast, zero-backend synthetic contract testing.
  * **Live Mode:** Real network calls executed through an integrated lightweight CORS proxy gateway.
* **Offline Persistence:** Pure browser storage using Dexie.js (IndexedDB) with automatic state recovery, collection grouping, and zero cloud lock-in.
* **Multi-Format Code Generator:** Export requests to production-ready `cURL`, `TypeScript Fetch`, `Axios`, and `Python requests` snippets in 1 click.
* **Specification Interoperability:** Seamlessly import and export official **OpenAPI 3.1.0** and **Postman Collection v2.1** formats.

---

## 📚 Documentation Suite

Comprehensive documentation is available in the [**`docs/`**](./docs/) directory:

- 📖 [**What is APIFlow Studio?**](./docs/WHAT_IS_APIFLOW_STUDIO.md) — Product philosophy, problem solved, and architecture deep-dive.
- ⚡ [**Product Guide & Specifications**](./docs/PRODUCT_GUIDE.md) — Faker engine heuristics, HTTP status schemas, and IndexedDB schema design.
- 🖥️ [**User Interface Guide**](./docs/USER_GUIDE.md) — 3-pane layout, shortcut keys, and theme system.
- 📘 [**User Manual**](./docs/USER_MANUAL.md) — Managing collections, environments, headers, request bodies, and mock scenarios.
- 🎓 [**Step-by-Step Tutorials**](./docs/STEP_BY_STEP_TUTORIALS.md) — Practical workflows from frontend prototyping to contract handoff.
- 📱 [**Deployment & Hosting Guide**](./docs/DEPLOYMENT_AND_HOSTING_GUIDE.md) — Homelab Docker setup, VPS guides, and 24/7 spare phone hosting via Termux.

---

## 📄 License

This project is open source and available under the [**MIT License**](./LICENSE).
