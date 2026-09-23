# 📘 APIFlow Studio — Comprehensive User Manual & Operations Guide

---

## 1. Managing Collections

### Creating a New Collection
1. Click the **Collection Selector** dropdown in the top left navbar.
2. Click **"+ Create New Collection"**.
3. Enter your desired collection name (e.g. `Payment Gateway API`) and click **Save**.
4. The studio will switch to your new empty collection ready for endpoints.

### Switching Between Collections
1. Open the collection dropdown.
2. Click any collection title to instantly load its endpoints from IndexedDB.

### Deleting a Collection
1. In the collection dropdown, hover over the collection you wish to remove.
2. Click the red **Trash Can** icon and confirm deletion.

---

## 2. Managing Endpoints

### Adding an Endpoint
1. In the sidebar header, click the **`+`** button.
2. A new endpoint titled `New Endpoint` will appear.
3. In the Request Builder, rename the title and specify a resource category (e.g., `Billing`).

### Configuring Method and Path
1. Click the HTTP Method dropdown (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
2. In the path input field, type your API route:
   - For static routes: `/api/v1/customers`
   - For parameterized routes: `/api/v1/customers/:id` or `/api/v1/orders/{orderId}`

---

## 3. Configuring Request Parameters & Headers

### Adding Query Parameters
1. In the Request Builder, select the **Query Params** tab.
2. Click **"+ Add Row"**.
3. Type the parameter name (e.g., `page`) and value (e.g., `1`).
4. Toggle the checkbox on or off to enable or disable the parameter without deleting it.
5. The live URL preview updates automatically.

### Adding Headers
1. Select the **Headers** tab.
2. Click **"+ Add Row"**.
3. Enter standard or custom headers:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer {{token}}`
   - `X-Api-Key`: `live_secret_key`

---

## 4. Writing & Auto-Generating Request Bodies

### Manual JSON Entry
1. Select the **Body** tab in the Request Builder.
2. Type or paste your JSON payload.
3. The editor verifies JSON syntax in real time. If there is a syntax error, a red error bar appears displaying the exact parser error.
4. Click **"Format"** to re-indent and beautify your JSON payload automatically.

### Auto-Generating Synthetic Payloads with Faker
1. On the **Body** tab, click **"Generate Synthetic Body"**.
2. The heuristic engine analyzes existing fields (or supplies realistic defaults) and generates:
   - Random real names (`Marcus Brody`)
   - Unique emails (`marcus.brody@enterprise.dev`)
   - Valid UUIDs and timestamps
   - Authentic pricing and currency codes

---

## 5. Simulating 7 HTTP Status Codes

When using **Mock Engine** mode, you can test how your frontend handles any server condition:

1. Locate the **Status Scenario** dropdown in the Request Builder.
2. Choose a status code:
   - `200 OK`: Returns successful response data.
   - `201 Created`: Returns newly created entity with `location` header and generated ID.
   - `400 Bad Request`: Returns structured client validation error schema.
   - `401 Unauthorized`: Returns authentication challenge with `WWW-Authenticate` header.
   - `403 Forbidden`: Returns permission denial payload.
   - `404 Not Found`: Returns standard missing resource error.
   - `500 Server Error`: Returns internal server error for fault tolerance testing.
3. Click **Simulate** (or press <kbd>Ctrl+Enter</kbd>).
4. The Response Viewer renders the exact simulated status, headers, and body with realistic 15–40ms latency.

---

## 6. Switching to Live Proxy Mode

To send real HTTP requests to external APIs (e.g. GitHub API, Stripe, or local backends) without running into browser CORS errors:

1. In the navbar, toggle the mode from **Mock Engine** to **`🌐 Live Proxy`**.
2. Ensure the backend server is running (`node backend/server.js`).
3. Set your target URL (e.g. `https://jsonplaceholder.typicode.com/posts/1`).
4. Click **Send**.
5. The request is dispatched via the backend `/proxy` gateway, bypassing CORS, and the live response is rendered in the Response Viewer.

---

## 7. Working with Environment Variables

1. Click the **Environment badge** in the navbar (or click the Settings gear icon).
2. The **Environment Variables Modal** opens.
3. Select an environment (`Development`, `Staging`, `Production`) or click **`+`** to create one.
4. Add key-value variables:
   - `baseUrl` -> `https://api.enterprise.dev`
   - `token` -> `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `apiVersion` -> `v1`
5. Click **"Set Active"** to activate this environment.
6. In any URL, path, or header, use standard mustache syntax:
   - Path: `/api/{{apiVersion}}/users`
   - Header: `Bearer {{token}}`
7. APIFlow Studio resolves the variables dynamically at execution time.

---

## 8. Importing & Exporting Collections

### Exporting Collections
1. In the top navbar, click **`⬇️ Portability`**.
2. Select the **Export Collection** tab.
3. Choose your target format:
   - **OpenAPI 3.1.0 JSON**: Click **Download** to save standard OpenAPI spec, or **Copy** to clipboard.
   - **Postman Collection v2.1.0 JSON**: Click **Download** to save Postman JSON with folders, environments, and headers.

### Importing Collections
1. Click **`⬇️ Portability`** and switch to the **Import Specs** tab.
2. Drag and drop your `.json` file, or click **"Choose File"**, or paste the raw JSON into the text area.
3. Click **"Import Collection"**.
4. The parser detects whether the file is OpenAPI or Postman, converts all operations into endpoints, and saves them into your local Dexie database.

---

## 9. Viewing History & Replaying Requests

1. Click the **`🕒 History`** button in the top navbar.
2. The modal displays your last 50 executed requests with status badges, URL paths, and latency measurements.
3. Click any row or the **Play** button:
   - The endpoint and parameters are loaded into the Request Builder.
   - The recorded response is restored into the Response Viewer.
4. Click **"Clear History"** if you want to reset your execution history.
