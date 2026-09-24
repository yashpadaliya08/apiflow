# 📚 APIFlow Studio — Documentation Hub

Welcome to the official documentation for **APIFlow Studio** — the lightweight, browser-first API testing studio, contract simulator, and synthetic mock engine.

---

## 🧭 Documentation Map

| Document | Description | Target Audience |
|---|---|---|
| 📖 [**What is APIFlow Studio?**](./WHAT_IS_APIFLOW_STUDIO.md) | High-level product overview, problem solved, core value proposition, and competitor comparison (Postman, Insomnia, Mockoon). | Everyone, Product Managers, Engineers |
| ⚡ [**Product Guide & Architecture**](./PRODUCT_GUIDE.md) | Deep-dive into technical architecture, synthetic heuristics engine, dual execution mode, and Dexie.js persistence. | Developers, Architects, QA Leads |
| 🖥️ [**User Guide**](./USER_GUIDE.md) | Studio workspace overview, 3-pane interface tour, keyboard shortcuts, theme tokens, and navigation. | Frontend & QA Engineers |
| 📘 [**User Manual & How-To**](./USER_MANUAL.md) | Step-by-step instructions for managing collections, configuring headers, body editing, mock scenarios, and live proxy. | Daily Users, Developers, QA Testers |
| 🎓 [**Step-by-Step Tutorials**](./STEP_BY_STEP_TUTORIALS.md) | 4 practical hands-on walkthroughs from zero to advanced contract generation and frontend mocking. | Beginners & Frontend Teams |
| 📱 [**Deployment & Hosting Guide**](./DEPLOYMENT_AND_HOSTING_GUIDE.md) | Complete guide to running locally or hosting 24/7 on a spare Android phone via Termux & StackDoctor. | DevOps, Hobbyists, Self-Hosters |

---

## ⚡ Quick Start

### Docker Compose
```bash
git clone https://github.com/yashpadaliya08/apiflow.git
cd apiflow
docker compose up -d
# Studio available at http://localhost:5000
```

### Local Node.js
```bash
git clone https://github.com/yashpadaliya08/apiflow.git
cd apiflow
npm install
node backend/server.js
# Studio available at http://localhost:5000
```
