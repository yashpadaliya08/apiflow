# 🎓 APIFlow Studio — Hands-on Step-by-Step Tutorials

---

## Tutorial 1: Rapid Frontend Component Prototyping Without a Backend

**Objective**: Build and test a React User Profile component against a mocked `/api/v1/users/:id` endpoint before the backend is even written.

### Step 1: Launch APIFlow Studio
1. Open `http://localhost:5000` in your browser.
2. Ensure **Mock Engine** mode is selected in the navbar.

### Step 2: Select the "Get User Profile" Endpoint
1. In the sidebar under the **Users** group, click **"Get User Profile"** (`GET /api/v1/users/:id`).
2. Notice the pre-configured path param `id: usr_101`.

### Step 3: Run the Mock Simulation
1. Set the Scenario dropdown to **`200 OK`**.
2. Click **Simulate** (or press <kbd>Ctrl+Enter</kbd>).
3. In the Response Viewer, examine the generated payload:
   ```json
   {
     "id": "usr_101",
     "name": "Marcus Brody",
     "email": "marcus.brody@enterprise.dev",
     "role": "Senior Engineer",
     "tier": "Enterprise"
   }
   ```

### Step 4: Export TypeScript Client Code
1. Click the **`</> Code`** button in the navbar.
2. Select the **TypeScript (Fetch)** tab.
3. Click **"Copy Snippet"**.
4. Paste directly into your React application's data hook or `useEffect`:
   ```typescript
   const response = await fetch('https://api.enterprise.dev/api/v1/users/usr_101', {
     method: 'GET',
     headers: {
       "Content-Type": "application/json"
     }
   });
   const user = await response.json();
   ```

You now have a working frontend prototype fully wired up to standard contracts!

---

## Tutorial 2: Testing Edge-Case Error Handling in Your Frontend

**Objective**: Verify that your UI gracefully handles token expiration (`401 Unauthorized`) and unexpected outages (`500 Server Error`).

### Step 1: Simulate 401 Unauthorized
1. In APIFlow Studio, select the **"List Orders"** endpoint (`GET /api/v1/orders`).
2. In the Scenario dropdown, change the selection from `200 OK` to **`401 Unauthorized`**.
3. Click **Simulate**.
4. Inspect the Response Viewer:
   - Notice the status pill turns red: `401 Unauthorized`.
   - Inspect the **Headers** tab: verify `WWW-Authenticate: Bearer realm="APIFlow Studio"`.
   - Verify the error body:
     ```json
     {
       "statusCode": 401,
       "error": "Unauthorized",
       "message": "Missing, invalid, or expired Bearer authentication token"
     }
     ```
5. You can now confirm that your frontend auth interceptor correctly catches `401` and redirects the user to the login screen.

### Step 2: Simulate 500 Server Crash
1. Change the Scenario dropdown to **`500 Server Error`**.
2. Click **Simulate**.
3. Verify that your frontend error toast or Error Boundary displays the proper friendly alert rather than crashing the page.

---

## Tutorial 3: Seamless Migration from Postman to APIFlow Studio

**Objective**: Import an existing team Postman collection into APIFlow Studio with zero manual reconfiguration.

### Step 1: Export Collection from Postman
1. In Postman Desktop, right-click any collection in the sidebar.
2. Click **Export**.
3. Choose **Collection v2.1 (recommended)** and save the `.json` file to your computer.

### Step 2: Import into APIFlow Studio
1. In APIFlow Studio, click the **`⬇️ Portability`** button in the navbar.
2. Switch to the **Import Specs** tab.
3. Click **"Choose File"** and select your exported Postman `.json` file (or paste its content into the text area).
4. Click **"Import Collection"**.

### Step 3: Verify Imported Endpoints
1. A success alert confirms the imported collection and endpoint count.
2. The collection is immediately active in the sidebar, organized with all original query parameters, headers, and request bodies preserved in IndexedDB.

---

## Tutorial 4: Exporting OpenAPI 3.1 Specs for Backend Engineers

**Objective**: Hand off contracts defined by frontend teams directly to backend engineers building FastAPI, Laravel, Express, or Spring Boot services.

### Step 1: Define Your API Endpoints in APIFlow Studio
1. Add your desired endpoints with realistic request and response bodies.
2. Group them under clean tags (e.g. `Billing`, `Notifications`).

### Step 2: Export OpenAPI 3.1 Spec
1. Click **`⬇️ Portability`** in the navbar.
2. Under the **Export Collection** tab, locate **OpenAPI 3.1.0 Spec**.
3. Click **Download**.
4. A standard `*.json` file is saved to your computer.

### Step 3: Backend Hand-off
1. Send the file to your backend team.
2. They can directly import it into Swagger UI, Redoc, Postman, or generate server stubs using `openapi-generator-cli`.
