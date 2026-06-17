# Meridian

<div align="center">

**Real-Time Adaptive Customer Intelligence Platform powered by IPC Engine**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

</div>

---

## Authentication Status

The login and register pages have been thoroughly validated:
- Password hashing is enabled and functional.
- Database is properly seeded with initial accounts.
- All authentication endpoints are fully operational.
- JWT token generation and validation are active.

---

## Quick Start

### Backend Server

**Note:** The Deep-Reasoning LLM (Tier 3) requires a valid `GEMINI_API_KEY` to be set in your `backend/.env` file. Without it, the IPC engine will gracefully degrade to Tier 1 or Tier 2 fallback routing.

```bash
cd backend
venv\Scripts\activate
python reset_db_force.py  # Reset and seed database
uvicorn app.main:app --reload
```
The backend runs on `http://localhost:8000`.

### Frontend Server

**Note:** The frontend dependencies are locked for compatibility with Node.js 22.11.0.

```bash
cd frontend
npm install
npm run dev
```
The frontend runs on `http://localhost:5173`.

---

## Login Credentials

### Admin Dashboard
```
Email: admin@Meridian.ai
Password: admin123
```

### Customer Portal
```
Email: dhruv.bhat35@gmail.com
Password: password123
```

---

## Dataset Integration

There are two methods to populate the Meridian database:

### 1. Instant Demo Seed (Recommended)
Suitable for instant testing and dashboard population. Loads 50 customers, 200 orders, and thousands of real-world events.
```bash
cd backend
venv\Scripts\activate
python reset_db_force.py
```

### 2. Comprehensive Hackathon Dataset (46,000+ records)
Use this to inject the full production-sized dataset.
```bash
cd backend
venv\Scripts\activate
python fast_load.py
```
**Note:** Avoid using the original `comprehensive_loader.py` script directly, as it runs synchronously with debug logs, which may lock the database for an extended period. The `fast_load.py` script is optimized to load the dataset efficiently.

---

## Core Features

### Intelligence Evolution
- **Decision Memory:** Records contextual decisions made by the IPC engine, ensuring the platform learns from historical outcomes rather than just predicting isolated events.
- **Counterfactual Intelligence:** Simulates alternative decisions alongside the primary action, providing comparative insights into paths not taken.
- **Decision Compression Score:** Measures the efficiency of the intelligence layer by tracking accurate predictions over total escalations.
- **Three-Tiered Pipeline:** Dynamically routes tasks through Semantic Cache, Specialized ML Models, and LLMs based on complexity to optimize compute cost and latency.

### Authentication System
- Secure JWT-based authentication.
- Role-based access control (Admin/Customer).
- Bcrypt password hashing.
- Session management with Zustand.

### Admin Dashboard
- **Executive Summary:** Real-time KPIs and business metrics.
- **Customer 360 View:** Complete customer intelligence profiles.
- **Analytics Center:** Advanced data visualization and insights.
- **Campaign Builder:** Creation and management of marketing campaigns.

### AI-Powered Features
- **Next Best Action (NBA):** AI-recommended customer actions based on journey context.
- **Churn Prediction:** Identification of at-risk customers using multi-dimensional behavior tracking.
- **Digital Twin:** Simulation of customer scenarios and outcomes.
### Trust & Governance
- **Trust Center:** Transparency and compliance monitoring.
- **Observability:** System health and performance tracking.

### Business Intelligence
- **ROI Calculator:** Campaign and feature ROI analysis.
- **Predictive Analytics:** CLV, churn, and retention forecasting.

### Customer Portal
- Product browsing and shopping cart.
- Order tracking and history.
- Support ticket system.
- Personalized recommendations based on intelligence profiles.

---

## Intelligence-Per-Compute (IPC) Engine

The backend architecture is driven by a tiered event-driven architecture designed to minimize LLM costs while maximizing speed and intelligence density:

1. **Tier 1 (Semantic Cache & Rules):** Instantly resolves common queries using cached parameters and predefined heuristics.
2. **Tier 2 (ML Models):** Employs lightweight probabilistic models (Scikit-Learn RandomForestClassifier) to handle standard engagements and predictive routing.
3. **Tier 3 (LLM Escalation):** Escapes to advanced LLMs (Google Gemini) only when context is highly ambiguous, unstructured, or requires complex reasoning.

---

## Infrastructure

### 1. Thread-Safe Atomic Metrics Cache
The original metrics store has been replaced with a highly concurrent, thread-safe `fake_redis.db` utilizing SQLite WAL (Write-Ahead Logging) mode and UPSERT queries to achieve Redis-level atomicity natively.

### 2. Real-Time Push WebSockets
HTTP frontend polling has been eliminated. Live metrics and events are dynamically broadcasted via background asyncio tasks pushing updates through the `/ws/admin` WebSocket, achieving near-zero latency updates and massive bandwidth reduction.

### 3. Failsafe LLM Degradation
The Gemini API router is wrapped in a strict failure-handling architecture. API timeouts, quota limits, or missing keys gracefully degrade to a Tier 1 or Tier 2 fallback routing decision rather than producing critical service failures.

---

## Architecture Structure

### Backend (FastAPI)
```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── models/              # SQLAlchemy ORM models
│   ├── routers/             # API endpoints
│   ├── database/            # Database connection and seeder
│   ├── intelligence/        # IPC Engine, Memory, Counterfactuals
│   ├── utils/               # JWT and utilities
│   └── websocket/           # Real-time WebSocket manager
├── datasets/                # Real datasets
├── fast_load.py             # Optimized dataset loader
├── reset_db_force.py        # Database reset script
└── requirements.txt
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/               # Customer portal and Admin dashboard
│   ├── layouts/             # Navigation structures
│   ├── services/            # Axios HTTP clients
│   └── store/               # Zustand state management
└── vite.config.ts
```

---

## Documentation

| Document | Description |
|----------|-------------|
| `SETUP_GUIDE.md` | Complete setup and troubleshooting instructions |
| `DATASETS_GUIDE.md` | Instructions for loading datasets |
| `backend/datasets/README.md` | Dataset format specifications |

---

## Testing

### API Documentation
Once the backend is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Troubleshooting

### "Invalid credentials" Error
Ensure your database is seeded:
```bash
cd backend
venv\Scripts\activate
python reset_db_force.py
```

### Backend Fails to Start
- Verify that port 8000 is available.
- Ensure the virtual environment is activated.
- Confirm all dependencies are installed: `pip install -r requirements.txt`.

### Frontend Connection Issues
- Ensure the backend is running on port 8000.
- Check `vite.config.ts` proxy settings.
- Clear browser cache and restart the dev server.

---

## Deployment

### Backend Deployment
- Compatible with Heroku, Railway, DigitalOcean, and AWS.
- It is recommended to upgrade from SQLite to PostgreSQL for production environments.
- Manage environment variables via the `.env` file.

### Frontend Deployment
- Compatible with Vercel, Netlify, and Cloudflare Pages.
- Update the API base URL in production.
- Build command: `npm run build`.

---

## License

This project is proprietary software developed for Meridian.

---

## Support

For issues or questions:
1. Refer to `SETUP_GUIDE.md` for solutions.
2. Review the console logs for detailed errors.
3. Verify that all services are actively running.
4. Reset the database if initial authentication fails.
