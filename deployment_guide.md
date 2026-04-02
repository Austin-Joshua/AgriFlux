# AgriFlux Production Deployment Guide

Follow these steps to deploy AgriFlux as a standalone, production-ready platform.

## 1. Database Setup (MongoDB Atlas)
> [!TIP]
> **Recommended Hosting**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free/Shared Tier).

1.  **Create Cluster**: Log in to Atlas and create a new cluster.
2.  **Network Access**: Add `0.0.0.0/0` to your IP Whitelist (or specific server IPs for maximum security).
3.  **Database User**: Create a user with `readWriteAnyDatabase` permissions.
4.  **Connection String**: Copy the SRV string (e.g., `mongodb+srv://<user>:<password>@cluster0.abc.mongodb.net/agriflux`).

---

## 2. Backend Deployment (Render)
> [!TIP]
> **Recommended Hosting**: [Render.com](https://render.com) (Web Service).

1.  **New Web Service**: Connect your GitHub repository.
2.  **Root Directory**: Set to `Backend`.
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm start`
5.  **Environment Variables**:
    - `PORT`: `5001`
    - `MONGODB_URI`: *[Your Atlas String]*
    - `JWT_SECRET`: *[A long random string]*
    - `CITIZENONE_INTEGRATION_KEY`: *[Shared secret with CitizenOne]*
    - `NODE_ENV`: `production`
    - `FRONTEND_URL`: *[Your Vercel URL once deployed]*

---

## 3. Frontend Deployment (Vercel)
> [!TIP]
> **Recommended Hosting**: [Vercel](https://vercel.com).

1.  **Import Project**: Connect your GitHub repository.
2.  **Root Directory**: Set to `Frontend`.
3.  **Framework Preset**: Select `Vite`.
4.  **Environment Variables**:
    - `VITE_API_URL`: *[Your Render Backend URL]* (e.g., `https://agriflux-api.onrender.com/api`)
5.  **Build & Deploy**: Click "Deploy."

---

## 4. Production Hardening Checklist
- [x] **Security**: `helmet`, `hpp`, and `rate-limit` are active in the backend.
- [x] **Performance**: Gzip `compression` is active for fast loading.
- [x] **SEO**: Dynamic page titles and meta tags are integrated via `SEO.tsx`.
- [x] **UX**: Professional notifications are active via `react-toastify`.
- [x] **Cross-Platform**: CitizenOne integration is ready via `X-Integration-Key`.

## 🚀 Scaling for Multiple Users
The backend is now configured to handle concurrent users efficiently with:
- **Rate Limiting**: Protects against brute-force login attempts.
- **Connection Pooling**: Mongoose automatically manages MongoDB connections.
- **Payload Limits**: Prevents large requests from crashing the server.

For high traffic (10k+ users), consider upgrading Render to a "Pro" instance to enable auto-scaling.
