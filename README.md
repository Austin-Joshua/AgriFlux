# 🌾 AgriFlux AI: Enterprise Agriculture Intelligence Platform

AgriFlux is a high-performance, scientifically validated agricultural analytics engine designed for national-level agronomy evaluations, researchers, and sustainable farming networks. By combining Copernicus Sentinel-2 satellite telemetry, real-time IoT sensor arrays, and predictive AI models, AgriFlux translates complex environmental data into actionable farming intelligence.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Frontend Client (React SPA)
        A[App Entry] --> B[Theme & Language Providers]
        B --> C[Protected Navigation Routes]
        C --> D[Farmer Workspace]
        C --> E[Agronomist Portal]
        C --> F[Admin Control Console]
        G[AIAssistantChat - Bilingual AI] <--> C
    end

    subgraph Service Backend (Express NodeJS)
        H[Express Server Router] <--> I[JWT Middleware Guard]
        H <--> J[Socket.io WebSocket Server]
        H --> K[API Controller Modules]
        K --> L[AgriFlux AI Engine]
    end

    subgraph Persistent Storage & IoT Layer
        M[(MongoDB System State)]
        N[ESP32 IoT Array Nodes] -->|HTTP POST / WebSockets| J
    end

    Frontend Client <-->|HTTP REST / WebSockets| Service Backend
```

---

## 🔬 Core Scientific Capabilities

### 1. High-Fidelity Satellite Vision & Vegetation Indices
AgriFlux processes simulated Bottom-Of-Atmosphere (BOA) reflectance bands from the **Copernicus Sentinel-2** constellation (10m spatial resolution, 5-day cycle) to map field vigor:

*   **Normalized Difference Vegetation Index (NDVI):**
    $$\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$$
    *Used to diagnose overall crop health, canopy density, and nitrogen absorption gaps.*
*   **Enhanced Vegetation Index (EVI):**
    $$\text{EVI} = 2.5 \times \frac{\text{NIR} - \text{Red}}{\text{NIR} + 6 \times \text{Red} - 7.5 \times \text{Blue} + 1}$$
    *Optimized to reduce soil background reflectance and atmospheric scatter in high-density biomass zones.*

### 2. GIS & Spatial Mapping (EPSG:4326)
*   **WGS 84 Coordinate Projection:** Seamless conversion of longitude/latitude polygons to calculate accurate acreage ($1\text{ ha} \approx 2.471\text{ acres}$) for land registration.
*   **Interactive SVG Heatmaps:** Telemetry crosshair tracking, perimeter polygons, and dynamic spectral color scales (Green: high vigor; Orange: stress; Red: critical crop health).

---

## 👥 Role-Based Workspaces & Flows

AgriFlux coordinates activities across three secure, context-specific user portals:

1.  **Farmer Portal (`/dashboard`)**
    *   Dynamic statistics on soil pH, moisture, and crop yield forecasting.
    *   3-step **Expert Consultation Booking Wizard** with scheduling state management.
    *   Real-time pump switches hooked to IoT nodes with automatic HTTP polling fallback.
2.  **Agronomist Portal (`/agronomist`)**
    *   Research-level data exploration tools (soil microbial indexes, disease classifications).
    *   Queue manager to confirm, cancel, or schedule video consultation bookings.
3.  **Admin Console (`/admin`)**
    *   Central dashboard showing database connection states and active socket connections.
    *   Emergency warning systems to dispatch instant weather notifications to all online farmers.

---

## 🛠️ Technology Stack

*   **Frontend**: React (v18), Vite, TypeScript (v5), Tailwind CSS (v3), Recharts, Framer Motion, i18next (English, Tamil, Hindi, Telugu, Malayalam).
*   **Backend**: Node.js, Express, Socket.IO, Mongoose/MongoDB, JWT Session Authentication.
*   **IoT**: ESP32 C++ Sketch, JSON payloads synced over WebSocket/HTTP channels.

---

## 🚀 Installation & Local Development

### Prerequisites
*   Node.js (v18 or higher)
*   MongoDB database (local instance or cloud string)

### Quick Start (Single Command)
1.  **Clone the Repository** and navigate to the project directory.
2.  **Bootstrap Environment & Dependencies**:
    ```bash
    npm run install-all
    ```
    *Installs all dependencies across the Root, Frontend, and Backend packages.*
3.  **Start Dev Servers**:
    ```bash
    npm run dev
    ```
    *Launches both the Express Backend (Port 5000) and Vite Frontend (Port 3000) concurrently.*

---

## 🔒 Security & Repository Protection Guidelines

To protect the repository in production and ensure presentation compliance:

1.  **Strict Environment Isolation**: Never commit actual credentials, API tokens, or session secrets. All environment parameters are isolated in a local `.env` file (configured using `.env.example` templates) and listed in the `.gitignore` exclusion array.
2.  **Route Protection Middleware**: All API requests under `/api/ai/*` and `/api/consultations/*` undergo authentication checks inside `auth.ts` checking for cryptographic JSON Web Tokens (JWT).
3.  **Input Sanitation**: Strict parameter validation enforces limits on search terms and consultation queries to prevent Cross-Site Scripting (XSS) and command injection vectors.
