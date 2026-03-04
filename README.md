# AgriFlux Platform - Local Dev Setup

AgriFlux is an AI-driven sustainable agriculture engine. This version is optimized for **local development**.

## 🚀 Quick Start (Single Command)

1. **Clone the repository**
2. **Install all dependencies** (Root, Frontend, Backend):
   ```bash
   npm run install-all
   ```
3. **Start both servers simultaneously**:
   ```bash
   npm run dev
   ```

## 🌐 Access
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 📁 Project Structure
- `/Frontend`: React + Vite UI components and AI pages.
- `/Backend`: Node.js + Express API services and controllers.
- `/Backend/ml`: Python ML integration templates.

## 🛠️ Requirements
- Node.js (v18+)
- npm

## 📝 Environment Variables
The backend requires a `.env` file. A default one is provided, but you can customize it using `.env.example`.
