# AdMatch AI

> AI-powered influencer–brand matching platform using Gemini AI + YouTube Data API.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MySQL via Sequelize ORM |
| Cache | Redis via ioredis |
| AI | Google Gemini API (`gemini-1.5-flash`) |
| YouTube | YouTube Data API v3 |

## Project Structure

```
admatch-ai/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                     # Node.js + Express backend
│   ├── config/
│   │   ├── db.js               # MySQL / Sequelize
│   │   ├── redis.js            # Redis / ioredis
│   │   └── gemini.js           # Google Gemini AI
│   ├── controllers/            # Route controllers
│   ├── middlewares/
│   │   ├── errorHandler.js     # Global error handler + AppError
│   │   └── auth.js             # JWT auth middleware (skeleton)
│   ├── models/                 # Sequelize models
│   ├── routes/                 # Express routers
│   ├── services/               # Business logic / external APIs
│   ├── utils/
│   │   ├── apiResponse.js      # Standard response helpers
│   │   └── logger.js           # Winston logger
│   ├── logs/                   # Rotating log files (git-ignored)
│   ├── index.js                # Server entry point
│   ├── .env.example
│   └── package.json
│
├── package.json                # Root — runs both with concurrently
└── .gitignore
```

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Fill in your DB, Redis, Gemini, and YouTube API keys
```

### 3. Start development servers

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### 4. Health check

```
GET http://localhost:5000/health
```

## Environment Variables

See [`server/.env.example`](./server/.env.example) for the full list of required keys.

## Key APIs

| Module | Description |
|--------|-------------|
| `config/db.js` | Sequelize + MySQL connection pool |
| `config/redis.js` | ioredis with `setCache` / `getCache` helpers |
| `config/gemini.js` | `generateContent()` and `startChatSession()` wrappers |
| `utils/apiResponse.js` | `sendSuccess`, `sendError`, `sendPaginated`, etc. |
| `utils/logger.js` | Winston with daily-rotating files + Morgan stream |
| `middlewares/errorHandler.js` | Global handler covering Sequelize, JWT, MySQL errors |
