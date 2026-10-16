# AgriFlux Local Setup, Startup & Troubleshooting Guide

**Platform:** AgriFlux Agricultural Intelligence Engine  
**Target Event:** QUANTEX '26 Pre-Hackathon Baseline  
**Supported OS:** Windows 10/11, macOS, Linux  

---

## 1. Prerequisites

Before setting up AgriFlux locally, ensure the following runtimes are installed:

| Tool | Recommended Version | Verification Command |
|---|---|---|
| **Node.js** | `v18.x` – `v24.x` (LTS recommended) | `node -v` |
| **npm** | `v9.x` – `v11.x` | `npm -v` |
| **Git** | `v2.30+` | `git --version` |
| **MongoDB** | Optional (In-memory fallback built-in) | `mongod --version` |

---

## 2. Safe Dependency Installation

AgriFlux is structured as a light monorepo containing a root orchestrator, a React/Vite Frontend, and an Express/TypeScript Backend.

Install all dependencies reproducibly using the project lockfiles:

```powershell
# In the repository root:
npm run install-all
```

*What this command does:*
1. Installs root dependencies (`concurrently`).
2. Navigates into `Frontend/` and executes `npm install`.
3. Navigates into `Backend/` and executes `npm install`.

> [!IMPORTANT]
> Do NOT use `npm audit fix --force` or manual major dependency upgrades, as this can introduce breaking API mismatches in `@types/react` and `express`.

---

## 3. Environment Variable Configuration

Create a local `.env` file in `Backend/` based on `Backend/.env.example`:

```powershell
# Copy the example file in Backend directory:
cp Backend/.env.example Backend/.env
```

### Environment Variable Reference (No Real Secrets Needed for Local Dev)

| Variable Name | Required in Dev? | Default / Safe Local Value | Description |
|---|---|---|---|
| `PORT` | No | `5001` | Express HTTP & Socket.IO server port |
| `NODE_ENV` | No | `development` | Set to `development` for local testing with built-in fallbacks |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed origin for CORS configuration |
| `JWT_SECRET` | No | `agriflux_default_secret_change_me` | Cryptographic key for signing user tokens |
| `JWT_EXPIRE` | No | `7d` | Token expiration lifespan |
| `MONGODB_URI` | No | `mongodb://localhost:27017/agriflux` | If unset or disconnected, backend uses in-memory buffer |
| `FIREBASE_PROJECT_ID` | No | `agriflux-demo` | In dev, unconfigured Firebase enables demo login buttons |
| `IOT_API_KEY` | No | `agriflux-iot-key-dev` | Key required in `x-iot-api-key` header for hardware sync |

---

## 4. Local Startup Procedure

### Option A: Single-Command Launch (Recommended)
Run both the Backend API and Vite Frontend simultaneously using the root orchestrator:

```powershell
# In the repository root:
npm run dev
```

- **Frontend Client:** Available at `http://localhost:3000`
- **Backend API:** Available at `http://localhost:5001`
- **Health Check:** `http://localhost:5001/health`

### Option B: Dual-Terminal Launch (Granular Logging)
If you want to view backend telemetry and frontend bundling logs in separate windows:

**Terminal 1 (Backend):**
```powershell
cd Backend
npm run dev
```

**Terminal 2 (Frontend):**
```powershell
cd Frontend
npm run dev
```

---

## 5. Automated Verification & Quality Gates

Run the automated test suite and static analysis checks to confirm code health:

```powershell
# 1. Run full automated backend test suite (22 tests)
cd Backend
npm test

# 2. Check Backend TypeScript compilation
npm run build

# 3. Check Backend ESLint rules
npm run lint

# 4. Check Frontend production bundle & TypeScript
cd ../Frontend
npm run build

# 5. Check Frontend ESLint rules
npm run lint
```

---

## 6. Safe Reset Procedures (Disposable Test Data)

If you need to reset the application state during manual testing:

1. **Clear Browser Session & Stale Tokens:**
   - In Chrome/Firefox/Edge, press `F12` -> Application / Storage -> **Clear Site Data** (or run `localStorage.clear()` in console).
2. **Clear In-Memory IoT Telemetry:**
   - Restart the backend process (press `Ctrl + C` in the Backend terminal and run `npm run dev` again). All in-memory buffers reset to calibrated baseline values.
3. **Reset Local MongoDB Test Records (Optional):**
   - If connected to local MongoDB:
     ```javascript
     // In mongosh:
     use agriflux
     db.iotreadings.deleteMany({})
     db.fieldrecommendations.deleteMany({})
     ```

---

## 7. Common Setup Failures & Troubleshooting

### Problem 1: Port `5001` or `3000` already in use (`EADDRINUSE`)
- **Cause:** A previous Node.js process did not terminate cleanly.
- **Solution (Windows PowerShell):**
  ```powershell
  # Find PID using port 5001:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process -Force
  # Find PID using port 3000:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```

### Problem 2: Missing MongoDB Connection Warning
- **Log message:** `⚠️ [DATABASE WARNING] MongoDB connection failed... operating in IN-MEMORY MODE`
- **Explanation:** This is an intentional, graceful fallback. AgriFlux is designed to run in standalone demo mode without requiring a running MongoDB service. All IoT telemetry and Field Intelligence recommendations are buffered in memory.

### Problem 3: PowerShell Script Execution Blocked (`PSSecurityException`)
- **Cause:** Windows ExecutionPolicy restricts running `.ps1` scripts like nodemon or vite.
- **Solution:**
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### Problem 4: Prettier / ESLint Line-Ending Errors (`Delete ␍`)
- **Cause:** Git checking out Windows CRLF line endings on files configured for Unix LF.
- **Solution:** Already configured in `.prettierrc` (`"endOfLine": "auto"`). Run `npm run format` in `Backend` or `Frontend` if newly authored files produce warnings.
