# 📘 APIFlow Studio — Master Architecture Breakdown & Complete User Guide

> **The Next-Generation, Zero-Setup API Testing Studio, Synthetic Mock Runner & Telemetry Engine**

---

## 📑 Table of Contents
1. [What is APIFlow Studio?](#1-what-is-apiflow-studio)
2. [High-Level Architecture (Frontend + Backend)](#2-high-level-architecture)
3. [Part 1: Top Navigation & Global Controls](#3-part-1-top-navigation--global-controls)
4. [Part 2: Left Sidebar (Collections & History)](#4-part-2-left-sidebar-collections--history)
5. [Part 3: Request Builder (Live vs Synthetic Mock)](#5-part-3-request-builder)
6. [Part 4: Automated Assertions & Quality Engine](#6-part-4-automated-assertions--quality-engine)
7. [Part 5: Response Viewer & Diagnostics](#7-part-5-response-viewer--diagnostics)
8. [Part 6: Power Tools & Modals](#8-part-6-power-tools--modals)
   - Collection Runner (Automated Batch Testing)
   - Multi-Language Code Snippet Generator
   - Import & Export (Postman & OpenAPI 3.0)
   - Environment Variables & Secret Vault
   - Webhook Inspection Studio
9. [Part 7: Backend Engine & Security Architecture](#9-part-7-backend-engine--security-architecture)
10. [Part 8: Admin Telemetry & Real-Time Dashboard (`/stats`)](#10-part-8-admin-telemetry)

---

## 1. What is APIFlow Studio?

**APIFlow Studio** is a unified, high-performance API testing platform that bridges the gap between **Postman** (live API execution & automation) and **Mockoon** (synthetic offline mocking & faker schema generation).

### Key Differentiators:
* **Zero CORS Frustration**: Built-in backend proxy routes live requests without browser CORS errors.
* **Dual Execution Modes**: Test real endpoints live, or simulate entire responses offline using synthetic dynamic generators.
* **Privacy-First & Local-Storage Powered**: Your API keys, collections, and environments stay in your browser (IndexedDB / LocalStorage) and never get stored on remote servers.
* **Built-in Real-Time Telemetry**: Real-time traffic, referrer analytics (Reddit, Twitter, Product Hunt), and live usage metrics.

---

## 2. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        APIFlow Studio Client                          │
│               (React 18 + TypeScript + Vite + Tailwind/CSS)           │
├───────────────────────────────────┬────────────────────────────────────┤
│  Navigation & Environment Store   │  Sidebar (Collections & History)   │
├───────────────────────────────────┴────────────────────────────────────┤
│  Request Studio:                                                       │
│   • Mode: Live Proxy vs Synthetic Mock Generator                      │
│   • Method, URL, Query Params, Headers, Auth, Body                     │
│   • Assertion Rules Engine (Status, Latency, JSON Path, Regex)         │
├────────────────────────────────────────────────────────────────────────┤
│  Response Viewer:                                                      │
│   • Tree / Raw / Formatted JSON, Headers, Latency, Size                │
│   • Pass/Fail Assertion Scorecard                                      │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP / JSON
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   APIFlow Unified Node.js Server                       │
│                         (backend/server.js)                            │
├────────────────────────────────────────────────────────────────────────┤
│  1. SPA Static File Server       ──> Serves compiled Vite frontend     │
│  2. Universal CORS Proxy (/proxy)──> SSRF-Protected Live API Relay     │
│  3. Telemetry Ingestion Engine   ──> Active visitors & campaign tags   │
│  4. Admin Analytics Dashboard    ──> Private KPI visualizer (/stats)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Part 1: Top Navigation & Global Controls

Located at the top header of the application:

1. **Logo & Home Link**: Toggles between the high-impact Marketing Landing Page and the interactive Studio workspace.
2. **Environment Selector (`{{env}}`)**:
   * Switch between **Development**, **Staging**, **Production**, or **Mock**.
   * Manage variables like `{{baseUrl}}`, `{{apiKey}}`, `{{token}}`. APIFlow automatically substitutes these double-bracket placeholders in your URLs, headers, and request bodies before sending.
3. **Collection Runner Button (▶ Run)**:
   * Opens the automated batch-testing modal to execute all requests in sequence.
4. **Import / Export**:
   * 1-click import from cURL, Postman Collection v2.1, or OpenAPI 3.0 / Swagger JSON/YAML.
5. **Code Snippets (`</>`)**:
   * Instantly generate copy-paste code in 8 languages (cURL, Axios, Fetch, Python, Go, Rust, Java, PHP).
6. **Live Telemetry Pill**:
   * Shows real-time visitor and simulation counts.

---

## 4. Part 2: Left Sidebar (Collections & History)

The sidebar acts as your API file explorer:

### Collections Tab
* **Create Collections & Folders**: Group your APIs by project or microservice (e.g., `Auth Service`, `Payment APIs`, `User Management`).
* **Drag-and-Drop Organization**: Reorder requests or move them between folders.
* **HTTP Method Badges**: Visual color-coded method badges (`GET` in blue, `POST` in green, `PUT` in orange, `DELETE` in red).
* **Search Filter**: Instantly fuzzy-search across requests by name or URL endpoint.

### History Tab
* Automatically records every request you fire.
* Displays response code (`200 OK`, `404 Not Found`), latency in ms, and timestamp.
* Clicking any history entry restores the exact headers, body, and URL back into the builder.

---

## 5. Part 3: Request Builder

The central engine for crafting API calls:

### 1. Dual Mode Switcher
* **Live Mode (⚡)**: Routes the request through the backend proxy directly to the real internet server.
* **Synthetic Mock Mode (🧪)**: Generates instant realistic mock responses on the fly using built-in schemas, faker generators, and templates without calling any external server.

### 2. Method & URL Bar
* Supports all HTTP verbs: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`.
* Supports dynamic path variables and environment placeholders:
  `{{baseUrl}}/api/v1/users/{{userId}}`

### 3. Builder Tabs
| Tab | Description |
|---|---|
| **Params** | Key-value table for URL query parameters with enable/disable checkboxes. |
| **Headers** | Custom HTTP headers (e.g., `Content-Type`, `X-Custom-Header`). Pre-populated with sensible defaults. |
| **Auth** | Authentication helper: None, Bearer Token, Basic Auth (Username/Password), or API Key (Header or Query). |
| **Body** | Raw JSON editor, Form-Data, x-www-form-urlencoded, or synthetic mock generator presets. |
| **Assertions** | Define automated test rules that run immediately after the response arrives. |

---

## 6. Part 4: Automated Assertions & Quality Engine

Located under the **Assertions** tab in the Request Builder:

### Supported Assertion Types:
1. **Status Code**: Check if `status == 200`, `status < 400`, or `status in [200, 201]`.
2. **Response Time (Latency)**: Ensure `response_time < 500ms` for SLA compliance.
3. **JSON Path Check**: Deep path queries (e.g., `data.user.id` exists, `status == "success"`).
4. **Header Verification**: Assert presence of `Content-Type: application/json`.
5. **Regex Pattern**: Validate strings (e.g., UUID format, email regex).

When a request executes, the **Response Inspector** displays a visual scorecard showing:
* ✅ Passed rules (green)
* ❌ Failed rules with detailed expected vs. actual values (red)

---

## 7. Part 5: Response Viewer & Diagnostics

The right panel renders the complete execution outcome:

* **Status Badge**: Displays HTTP status code and message (`200 OK`, `401 Unauthorized`, `500 Internal Server Error`).
* **Metrics Ribbon**:
  * **Duration**: Accurate round-trip latency in milliseconds.
  * **Size**: Response payload size formatted in KB/MB.
* **Response Body Viewers**:
  * **Pretty JSON**: Formatted, syntax-highlighted, with collapsible tree nodes.
  * **Raw Text**: Unformatted raw text view.
  * **Preview**: HTML/Text preview when applicable.
  * **Search & Copy**: Search through large JSON responses and copy JSON with one click.
* **Headers Inspector**: View all headers returned by the server.
* **Test Results Tab**: Shows the pass/fail breakdown of all configured assertions.

---

## 8. Part 6: Power Tools & Modals

### 1. Collection Runner (Batch Test Automation)
* Run an entire collection of 20+ endpoints in sequence.
* Configure **delay between requests** (e.g., 200ms) and **iteration loops**.
* Displays a live progress bar, real-time log stream, and a final summary report of passed vs. failed tests.

### 2. Multi-Language Code Snippets (`</>`)
Converts your exact request (headers, query params, auth, and JSON body) into ready-to-run code in:
* **cURL** (Terminal command)
* **JavaScript** (Fetch API & Axios)
* **Python** (`requests` library)
* **Go** (`net/http`)
* **Rust** (`reqwest`)
* **Java** (`HttpClient`)
* **PHP** (`cURL`)

### 3. Import & Export
* **Import**: Paste raw cURL commands or drag-and-drop Postman `collection.json` and OpenAPI `openapi.yaml/json` specs.
* **Export**: Export your workspace as Postman Collection v2.1 or OpenAPI 3.0 specification for easy team sharing.

### 4. Environments & Secrets Manager
* Define custom variable sets (e.g., `DEV`: `baseUrl = http://localhost:3000`, `PROD`: `baseUrl = https://api.mysite.com`).
* Mask sensitive tokens so they don't display on screen.

### 5. Webhook Testing Studio
* Test and trigger incoming webhooks, inspect webhook payloads, and simulate third-party events (Stripe, GitHub, Shopify).

---

## 9. Part 7: Backend Engine & Security Architecture

The backend (`backend/server.js`) is an Express 5 engine designed for zero-configuration, secure proxying and serving:

### Key Backend Components:
1. **Universal CORS Relay (`/proxy?url=...`)**:
   * Uses native Node.js HTTP/HTTPS agents.
   * Relays method, query parameters, custom headers, and request body.
2. **Enterprise SSRF Protection**:
   * **Private IP Filter**: Blocks requests targeting `127.0.0.1`, `localhost`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`.
   * **Cloud Metadata Blocking**: Restricts access to AWS/GCP/Azure internal metadata (`169.254.169.254`, `metadata.google.internal`).
   * **Restricted Ports**: Blocks proxy forwarding to internal ports (SSH 22, MySQL 3306, Redis 6379, etc.).
3. **Static Production Host**:
   * Detects `frontend/dist`.
   * Serves static assets with 1-year immutable caching (`max-age=31536000`).
   * Handles SPA client-side routing so refreshing `/runner` or `/workspace` never causes 404s.

---

## 10. Part 8: Admin Telemetry & Real-Time Dashboard (`/stats`)

Your application includes a built-in telemetry visualizer accessible at:
```text
https://<your-domain>/stats?key=apiflow-admin-2026
```

### What it tracks:
* **Active Concurrent Users**: Real-time visitors currently exploring the site.
* **Traffic Sources**: Direct, Reddit (`r/selfhosted`, `r/webdev`), Twitter / X, Hacker News, Google.
* **Live Activity Feed**: Real-time stream of visitors with device type (Mobile/Desktop), country, and masked IP address for privacy.
* **Campaign Link Generator**: One-click generation of tracked URLs (e.g. `/?ref=reddit`).
