# ⚡ APIFlow Studio — Product Architecture & Technical Specifications

---

## 1. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        APIFlow Studio Architecture                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ Client Browser ]                                                   │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ React 19 + TypeScript + TailwindCSS v4 SPA                  │     │
│   │                                                              │     │
│   │  ┌─────────────────┐    ┌─────────────────┐                 │     │
│   │  │   UI Store      │    │ Collection Store│                 │     │
│   │  │  (Zustand 5)    │    │   (Zustand 5)   │                 │     │
│   │  └────────┬────────┘    └────────┬────────┘                 │     │
│   │           │                      │                          │     │
│   │           ▼                      ▼                          │     │
│   │  ┌─────────────────────────────────────────┐                │     │
│   │  │      Dexie.js IndexedDB Engine          │                │     │
│   │  │  (Collections, Endpoints, Envs, History)│                │     │
│   │  └─────────────────────────────────────────┘                │     │
│   └──────────────────────────┬───────────────────────────────────┘     │
│                              │                                         │
│            ┌─────────────────┴─────────────────┐                       │
│            │ Execution Mode Switch             │                       │
│            ▼                                   ▼                       │
│   [ Mode A: Mock Engine ]             [ Mode B: Live Proxy ]           │
│   ┌───────────────────────────┐       ┌──────────────────────────────┐ │
│   │ Client-Side Mock Runner   │       │ Express 5 Backend (/proxy)   │ │
│   │ - 15-40ms Latency Jitter  │       │ - Strips Host/Origin headers │ │
│   │ - 7 HTTP Status Codes     │       │ - Transparent Stream Relay   │ │
│   │ - @faker-js/faker Engine  │       │ - Latency & Header Injection │ │
│   │ - Heuristic Field Matcher │       └──────────────┬───────────────┘ │
│   └───────────────────────────┘                      │                 │
│                                                      ▼                 │
│                                             [ External Live APIs ]     │
│                                             - GitHub API, Stripe, etc. │
│                                             - Local Staging / Dev APIs │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Stack Breakdown

### Frontend Core
- **Framework**: React 19.3.0 (`react`, `react-dom`)
- **Build Tool**: Vite 6.2.0 with `@vitejs/plugin-react`
- **Styling**: TailwindCSS v4.3.3 with `@tailwindcss/vite`
- **Design Tokens**: Stepped-luminance dark theme palette (`#0C0E12`, `#141720`, `#1C2030`, `#2A2F48`)
- **State Management**: Zustand 5 with partialized `localStorage` persistence
- **Local Database**: Dexie.js 4.4.6 (IndexedDB wrapper)
- **Synthetic Data**: `@faker-js/faker` 9.9.0
- **UI Primitives**: Radix UI (`@radix-ui/react-dialog`, tabs, dropdowns, scroll-area)
- **Icons**: Lucide React (`lucide-react`)
- **File Utilities**: `file-saver` for instant client-side downloads

### Backend & Proxy Gateway
- **Runtime**: Node.js 20.17.0+
- **Server**: Express 5.2.1
- **CORS**: `cors` with wildcard origin and exposed headers
- **Health Check**: `/health` returning runtime telemetry (uptime, architecture, platform)
- **CORS Bypass Proxy**: `/proxy?url=...` with full body streaming and response header forwarding

---

## 3. Synthetic Heuristics Engine Specification

The synthetic engine analyzes object field names and path parameters using regex heuristics to produce contextually accurate mock data:

| Field Pattern (Regex) | Generated Output Type | Example Output |
|---|---|---|
| `^(email\|email_address)$` | Internet Email | `alex.chen@enterprise.dev` |
| `^(password\|secret)$` | Secure Random Password | `9k#Lm!vP2$xR` |
| `^(token\|jwt\|access_token)$` | RFC 7519 Signed Mock JWT | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| `^(uuid\|guid)$` | RFC 4122 v4 UUID | `c3a886f7-11e2-45e0-b6f3-1823f6...` |
| `^(id\|userId\|orderId)$` | Alphanumeric Identifier | `usr_a89x2f41`, `ord_93b211a0` |
| `^(name\|full_name)$` | Person Full Name | `Elena Rostova`, `Marcus Brody` |
| `^(amount\|total\|price)$` | Floating Currency Value | `249.99` |
| `^(currency)$` | ISO 4217 Currency Code | `USD`, `EUR`, `GBP` |
| `^(avatar\|photo\|picture)$` | Avatar Image URL | `https://avatars.githubusercontent.com/...` |
| `^(timestamp\|created_at)$` | ISO 8601 Datetime | `2026-09-23T11:42:00.000Z` |
| `^(status)$` | Enum Status | `active`, `pending`, `suspended` |
| `^(role)$` | User Role | `admin`, `user`, `moderator` |

---

## 4. 7 HTTP Status Code Simulation Specifications

When running in **Mock Engine** mode, APIFlow Studio generates standard, RFC-compliant responses:

### 1. `200 OK`
- **Headers**: `content-type: application/json`, `cache-control: no-cache, no-store`, `x-powered-by: APIFlow Synthetic Engine`
- **Body**: Automatically generated list or detail schema according to endpoint resource (Auth, Users, Orders, Products).

### 2. `201 Created`
- **Headers**: Adds `location: https://api.enterprise.dev/api/v1/resource/id_x82a9`
- **Body**: Merges the sent request body with an auto-assigned `id` and `createdAt` timestamp.

### 3. `400 Bad Request`
- **Body**:
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Invalid request payload schema or missing required fields",
    "timestamp": "2026-09-23T11:45:00.000Z"
  }
  ```

### 4. `401 Unauthorized`
- **Headers**: `www-authenticate: Bearer realm="APIFlow Studio", charset="UTF-8"`
- **Body**:
  ```json
  {
    "statusCode": 401,
    "error": "Unauthorized",
    "message": "Missing, invalid, or expired Bearer authentication token",
    "timestamp": "2026-09-23T11:45:00.000Z"
  }
  ```

### 5. `403 Forbidden`
- **Body**:
  ```json
  {
    "statusCode": 403,
    "error": "Forbidden",
    "message": "Authenticated user lacks permission to access this resource",
    "timestamp": "2026-09-23T11:45:00.000Z"
  }
  ```

### 6. `404 Not Found`
- **Body**:
  ```json
  {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Resource at /api/v1/resource does not exist",
    "timestamp": "2026-09-23T11:45:00.000Z"
  }
  ```

### 7. `500 Internal Server Error`
- **Body**:
  ```json
  {
    "statusCode": 500,
    "error": "Internal Server Error",
    "message": "An unexpected server condition was simulated by APIFlow Studio",
    "timestamp": "2026-09-23T11:45:00.000Z"
  }
  ```

---

## 5. IndexedDB Storage Schema (Dexie.js)

Database Name: `APIFlowDB` (Version 1)

```ts
class APIFlowDatabase extends Dexie {
  collections!:  Table<Collection, string>;   // Index: id, name, createdAt
  endpoints!:    Table<Endpoint, string>;     // Index: id, collectionId, method, resource, name
  history!:      Table<HistoryEntry, number>; // Index: ++id, endpointId, timestamp, status, method
  environments!: Table<Environment, string>;  // Index: id, name, isActive
}
```
