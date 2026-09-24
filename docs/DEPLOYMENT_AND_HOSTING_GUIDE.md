# 📱 APIFlow Studio — Deployment & Phone Hosting Guide

> Learn how to run APIFlow Studio locally, build for production, or host it **24/7 on an old Android phone via Termux and StackDoctor with zero hosting fees**.

---

## 1. Quick Start Deployments

### Option A: Docker Compose (Recommended for Homelabs & VPS)
```bash
# Clone the repository
git clone https://github.com/yashpadaliya08/apiflow.git
cd apiflow

# Start containerized studio
docker compose up -d
```
Access the studio at `http://localhost:5000`.

### Option B: Local Node.js Production Server
```bash
# Navigate to project folder
git clone https://github.com/yashpadaliya08/apiflow.git
cd apiflow

# Install dependencies and start server
npm install
node backend/server.js
```
The server will run on `http://localhost:5000` (serving both the compiled React 19 single-page app and the `/proxy` gateway).

### Development Mode (Vite Hot-Reload)
```bash
# In terminal 1: Start backend proxy
cd backend
node server.js

# In terminal 2: Start Vite development server
cd frontend
npm run dev
```
Open `http://localhost:5173`. Any changes to frontend code will update instantly via Hot Module Replacement (HMR).

---

## 2. Compiling the Production Build

Before deploying to any server or spare phone, compile the frontend:

```powershell
# From root
npm run build

# Or directly in frontend
cd frontend
npm run build
```
This produces an optimized, minified bundle in `frontend/dist/`. `backend/server.js` automatically checks for `frontend/dist/` and serves it with SPA routing fallback.

---

## 3. 24/7 Zero-Cost Hosting on an Old Android Phone via StackDoctor

With **StackDoctor** (Laravel Doctor), you can transform a spare Android phone into a 24/7 edge server with free public HTTPS access via Cloudflare Tunnels.

### Step 1: Prepare the Spare Phone with Termux
1. Install **Termux** from F-Droid (avoid Google Play Store version).
2. Open Termux on the phone and run:
   ```bash
   pkg update && pkg upgrade -y
   pkg install openssh nodejs git -y
   ```
3. Set a password for SSH:
   ```bash
   passwd
   ```
4. Start the SSH daemon:
   ```bash
   sshd
   ```
5. Check your phone's local network IP:
   ```bash
   ifconfig wlan0
   ```
   (Note the IP, typically `192.168.1.xxx`, and port `8022`).

### Step 2: Deploying via StackDoctor
1. Open your **StackDoctor** management platform on your PC.
2. Register your spare phone target:
   - Host: `192.168.1.xxx`
   - Port: `8022`
   - User: `u0_a...` (your Termux username)
3. Select the **APIFlow Studio** project directory (the cloned repository folder).
4. StackDoctor's Doctor Engine will automatically:
   - Detect the stack as **Node.js — MERN Full-Stack** (98% confidence).
   - Pre-compile the Vite frontend bundle on your host machine.
   - Compress and transfer files via SFTP (skipping heavy `node_modules`).
   - Run `npm install --omit=dev` inside Termux on the phone.
   - Launch `node backend/server.js` on port `5000`.
   - Establish a **Cloudflare Tunnel** to publish a secure, public HTTPS URL (e.g. `https://apiflow-yourphone.trycloudflare.com`).

### Step 3: Monitoring & Telemetry
StackDoctor continuously monitors your spare phone's:
- **CPU Load & Temperature**
- **RAM Utilization** (APIFlow uses < 65 MB on Node.js)
- **Battery & Thermal State** (Keep the phone connected to a smart charger)
- **Live Health Check**: Polls `http://localhost:5000/health`

---

## 4. Backend Health Check Endpoint

APIFlow Studio includes a built-in health probe at `/health`:

```bash
curl http://localhost:5000/health
```

**Sample Response**:
```json
{
  "status": "online",
  "app": "APIFlow Studio Backend & CORS Proxy",
  "version": "1.0.0",
  "timestamp": "2026-09-23T11:43:27.872Z",
  "uptime": 1842.12,
  "nodeVersion": "v20.17.0",
  "platform": "win32",
  "arch": "x64"
}
```
This endpoint can be used with uptime services like UptimeRobot or StackDoctor health monitors.
