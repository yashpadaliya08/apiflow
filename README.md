# 🚀 APIFlow Studio

> **The Lightweight, Schema-Driven API Testing Studio, Contract Simulator & Mock Runner**  
> *Zero Backend Required • Pure Client-Side Simulation • OpenAPI 3.1 & Postman 2.1 Ready • Self-Hostable on Spare Phone or PC*

---

## ⚡ Quick Start

```powershell
# 1. Start fullstack production server (serves frontend + CORS proxy on port 5000)
cd "d:\projects\fake api testing\apiflow-studio"
node backend/server.js

# 2. Open in browser
# http://localhost:5000
```

---

## 📚 Complete Documentation Suite

All detailed guides and manuals are located in the [**`docs/`**](./docs/) directory:

- 📖 [**What is APIFlow Studio?**](./docs/WHAT_IS_APIFLOW_STUDIO.md) — Product vision, problems solved, and comparison against Postman, Insomnia, and Mockoon.
- ⚡ [**Product Guide & Specifications**](./docs/PRODUCT_GUIDE.md) — Deep-dive architecture, Faker heuristics engine, 7 HTTP status schemas, and IndexedDB design.
- 🖥️ [**User Interface Guide**](./docs/USER_GUIDE.md) — 3-pane layout tour, navigation, shortcuts, and theme design tokens.
- 📘 [**User Manual**](./docs/USER_MANUAL.md) — Comprehensive operation guide for managing collections, headers, bodies, environments, and mock scenarios.
- 🎓 [**Step-by-Step Tutorials**](./docs/STEP_BY_STEP_TUTORIALS.md) — 4 practical walkthroughs from rapid UI prototyping to Postman migration and contract hand-off.
- 📱 [**Deployment & Phone Hosting Guide**](./docs/DEPLOYMENT_AND_HOSTING_GUIDE.md) — Local PC deployment and 24/7 zero-cost hosting on an old Android phone via Termux and StackDoctor.

---

## 🌟 Key Features

- **100% In-Browser Mocking**: Simulate `200`, `201`, `400`, `401`, `403`, `404`, and `500` HTTP status codes with realistic latency and RFC headers.
- **Faker Heuristics**: Auto-generates names, UUIDs, JWT tokens, timestamps, and realistic enterprise mock payloads.
- **Dual Execution**: Instant local mock simulation or real network calls via local CORS bypass proxy.
- **Contract Portability**: Export and import official OpenAPI 3.1.0 and Postman Collection v2.1 JSON files.
- **Local Persistence**: Stores everything in browser IndexedDB (Dexie.js) — zero cloud tracking.
- **1-Click Code Generation**: Production-ready cURL, TypeScript Fetch, Axios, and Python requests snippets.
