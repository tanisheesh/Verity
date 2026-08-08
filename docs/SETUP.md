# Local Setup — VERITY

> **Just want to try it?** Use the live demo at [verity.tanisheesh.in](https://verity.tanisheesh.in) — no setup needed.  
> This guide is for running VERITY locally or self-hosting it.

---

## Prerequisites

- Node.js 20+
- npm 10+

No database, no Docker, no Python. The entire system is Node.js.

---

## 1. Clone and install

```bash
git clone https://github.com/tanisheesh/Verity
cd Verity

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

---

## 2. Environment variables

### Backend

Create a `.env` file in the project root:

```bash
# .env
PORT=3000
API_PREFIX=/api
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Express server listens on |
| `API_PREFIX` | `/api` | URL prefix for all API routes |

Both variables are optional — the server starts with its built-in defaults if `.env` is absent.

### Frontend

Create a `.env.local` file inside the `client/` directory:

```bash
# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API. Set to the Render URL in production. |

---

## 3. Run locally

Open two terminals:

**Terminal 1 — Backend**

```bash
# From project root
npm run dev
```

Server starts at `http://localhost:3000`. Swagger UI available at `http://localhost:3000/api-docs`.

**Terminal 2 — Frontend**

```bash
cd client
npm run dev
```

Frontend starts at `http://localhost:3001` (Next.js auto-selects 3001 if 3000 is taken).

---

## 4. Run tests

```bash
# From project root — runs all Vitest tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

The test suite includes unit tests for each analysis layer, API integration tests (Supertest), and property-based tests (fast-check).

---

## 5. Build for production

```bash
# Backend — compiles TypeScript to dist/
npm run build

# Start compiled backend
npm start

# Frontend — Next.js production build
cd client
npm run build
npm start
```

---

## 6. Deploy to production

### Backend — Render

1. Connect the repo to a new Render **Web Service**.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Set env var: `PORT` (Render provides this automatically).
5. No database or additional services needed.

### Frontend — Vercel

1. Connect the `client/` directory (or the monorepo root with `client` as the root directory) to a new Vercel project.
2. Set env var: `NEXT_PUBLIC_API_URL` → your Render backend URL (e.g. `https://verity-wfk0.onrender.com`).
3. Vercel runs `next build` automatically on push to main.

---

## Known local-only limitations

- The Render free tier spins down after 15 minutes of inactivity. The first request after a cold start may take 30–60 seconds. This does not affect a locally running backend.
- The frontend's `NEXT_PUBLIC_API_URL` must match exactly — trailing slash differences will cause 404s on the API routes.
