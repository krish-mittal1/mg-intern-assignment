# SignFlow

A full-stack e-signature app that lets users upload a PDF, request an Aadhaar-based eSign via
[Setu](https://setu.co/), track the signing status in real time, and download the signed document.

The frontend never talks to Setu directly — all credentials and API calls stay on the backend.

## Live deployment

| | URL |
|-|-----|
| **Frontend** | https://mg-intern-assignment.vercel.app |
| **Backend** | https://signflow-api.codexarena.app |

## Architecture

```
Browser (Next.js on Vercel)
        |
        | HTTPS (our own API only)
        v
FastAPI backend (Docker on Oracle Cloud VPS, Mumbai)
        |                    |
        | httpx              | SQLAlchemy asyncpg
        v                    v
   Setu APIs           PostgreSQL (Neon)
```

- **Frontend** (Next.js 15, TypeScript, Tailwind 4) — upload, status, landing pages.
- **Backend** (FastAPI, Python 3.12) — proxies every Setu call, keeps credentials server-side, persists metadata.
- **Database** (PostgreSQL via Neon) — one row per signature request, updated on every status poll.

### Why these choices

FastAPI was chosen over Express/Next.js API routes because async Python pairs naturally with
`httpx` and SQLAlchemy's async engine, and FastAPI's automatic OpenAPI docs (`/docs`) made
iterating on the Setu integration faster. Neon was chosen for the database because it offers
serverless Postgres with no instance management and a free tier that doesn't expire. The backend
is containerised with Docker so it can be deployed on any VM without environment conflicts —
important here because Setu's sandbox blocks non-Indian datacenter IPs, so the backend runs on
an Oracle Cloud VM in Mumbai (Indian IP) routed through a Cloudflare Tunnel for HTTPS.

## Sequence diagram

```
User          Frontend          Backend            Setu              DB
 |               |                 |                 |                |
 |  Upload PDF   |                 |                 |                |
 |-------------->|                 |                 |                |
 |               | POST /api/      |                 |                |
 |               | upload-contract |                 |                |
 |               |---------------->|                 |                |
 |               |                 | POST /api/      |                |
 |               |                 | documents       |                |
 |               |                 |---------------->|                |
 |               |                 |   documentId    |                |
 |               |                 |<----------------|                |
 |               |                 | POST /api/      |                |
 |               |                 | signature       |                |
 |               |                 |---------------->|                |
 |               |                 | signatureId,    |                |
 |               |                 | signerUrl       |                |
 |               |                 |<----------------|                |
 |               |                 | INSERT contract |                |
 |               |                 |--------------------------------->|
 |               | {documentId,    |                 |                |
 |               |  signatureId,   |                 |                |
 |               |  signerUrl}     |                 |                |
 |               |<----------------|                 |                |
 | Opens signing |                 |                 |                |
 | link (new tab)|                 |                 |                |
 |-----------------------------------------------------------> Setu   |
 |               |                 |                 |  (eMudhra OTP) |
 |               |                 |                 |                |
 | Check status  |                 |                 |                |
 |-------------->|                 |                 |                |
 |               | GET /api/       |                 |                |
 |               | signature-      |                 |                |
 |               | status/{id}     |                 |                |
 |               |---------------->|                 |                |
 |               |                 | GET /api/       |                |
 |               |                 | signature/{id}  |                |
 |               |                 |---------------->|                |
 |               |                 |     status      |                |
 |               |                 |<----------------|                |
 |               |                 | UPDATE contract |                |
 |               |                 |--------------------------------->|
 |               |   {status}      |                 |                |
 |               |<----------------|                 |                |
 |               |                 |                 |                |
 | Download      |                 |                 |                |
 |-------------->|                 |                 |                |
 |               | GET /api/       |                 |                |
 |               | download/{id}   |                 |                |
 |               |---------------->|                 |                |
 |               |                 | GET /api/       |                |
 |               |                 | signature/{id}  |                |
 |               |                 | /download/      |                |
 |               |                 |---------------->|                |
 |               |                 |  downloadUrl    |                |
 |               |                 |<----------------|                |
 |               |    PDF bytes    |                 |                |
 |               |<----------------|                 |                |
 |   PDF file    |                 |                 |                |
 |<--------------|                 |                 |                |
```

## Tech stack

| Layer    | Tech                                          |
|----------|-----------------------------------------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind 4  |
| Backend  | FastAPI, httpx, SQLAlchemy (async), asyncpg   |
| Database | PostgreSQL (Neon serverless)                  |
| Infra    | Vercel (frontend), Oracle Cloud VPS (backend), Cloudflare Tunnel (HTTPS) |
| External | Setu Aadhaar eSign APIs                       |

## Database schema

Table: `contracts`

| Column       | Type                     | Notes                        |
|--------------|--------------------------|------------------------------|
| id           | integer (PK)             | auto-increment               |
| document_id  | varchar(128), indexed    | Setu document ID             |
| signature_id | varchar(128), unique     | Setu signature request ID    |
| signer_url   | varchar(1024), nullable  | Setu-hosted signing URL      |
| filename     | varchar(512)             | original uploaded filename   |
| status       | varchar(64)              | e.g. `sign_initiated`, `sign_complete` |
| created_at   | timestamptz              | set on insert                |
| updated_at   | timestamptz              | updated on every status poll |

Tables are created automatically on startup — no migrations needed.

## Features

- Upload a PDF (max 10 MB) with file-type and size validation
- Create a Setu eSign request and return the signing URL
- Open the Setu signing page in a new tab
- Track signature status with real-time auto-polling (every 4 s)
- Contract history loaded from the database (no localStorage)
- Download the signed PDF once complete

## Project structure

```
mg-intern-assignment/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes
│   │   ├── config.py        # env / settings
│   │   ├── setu_client.py   # Setu API calls
│   │   ├── db.py            # async engine + session
│   │   └── models.py        # Contract ORM model
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── page.tsx         # landing
    │   ├── upload/          # upload page
    │   └── status/          # status + history page
    ├── components/Nav.tsx
    └── lib/api.ts
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally (or a hosted URL)
- Setu sandbox credentials (client id, secret, product instance id)

## Setup

### 1. Backend

```bash
cd backend
python -m pip install -r requirements.txt
```

Create `backend/.env` from the example and fill in your values:

```bash
cp .env.example .env
```

```env
SETU_BASE_URL=https://dg-sandbox.setu.co
X_CLIENT_ID=your-client-id
X_CLIENT_SECRET=your-client-secret
X_PRODUCT_INSTANCE_ID=your-product-instance-id
SIGN_REDIRECT_URL=https://httpbin.org/get
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/esign
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Create the `esign` database once (via `createdb esign` or pgAdmin). Tables are
created automatically on startup — no migrations needed.

Run the server:

```bash
python -m uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000` (interactive docs at `/docs`).

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

## API endpoints

| Method | Path                           | Purpose                              |
|--------|--------------------------------|--------------------------------------|
| GET    | `/health`                      | Health check                         |
| POST   | `/api/upload-contract`         | Upload PDF, create signature request |
| GET    | `/api/contracts`               | List saved contracts (history)       |
| GET    | `/api/signature-status/{id}`   | Get status from Setu, update DB      |
| GET    | `/api/download/{signature_id}` | Stream signed PDF                    |

## How it works

1. The frontend uploads a PDF to `/api/upload-contract`.
2. The backend sends it to Setu (`POST /api/documents`), then creates a signature
   request (`POST /api/signature`), and saves the record to PostgreSQL.
3. The user signs via the returned Setu-hosted signing link (opens in a new tab).
4. The status page polls `/api/signature-status/{id}` every 4 s; the backend refreshes the
   stored status when Setu reports a change.
5. Once signed (`sign_complete`), the signed PDF is fetched through `/api/download/{signature_id}`.

## Sandbox signing limitation

The upload and create-signature APIs work end to end against the Setu sandbox
(both return `201`, with a valid signing URL). The final OTP step runs on Setu's
hosted eSign screen, served by their ESP partner (eMudhra).

In the current sandbox, that page rejects the documented test Aadhaar (`999999990019`)
with `Invalid Aadhaar Number/Virtual ID`, so a request cannot reach `sign_complete` from
our side. This is an ESP sandbox behaviour — the same number is rejected on Setu's own
API Playground.

| Step                           | Works in sandbox |
|--------------------------------|------------------|
| Upload document                | Yes              |
| Create signature request       | Yes              |
| Open Setu signing page         | Yes              |
| Complete OTP on eSign page     | No (ESP sandbox) |
| Status becomes `sign_complete` | Only after OTP   |
| Download signed PDF            | Only after OTP   |

The status endpoint, polling, DB persistence, and download route are all implemented
and function as soon as a request reaches `sign_complete`.

## Security

- Credentials live only in `backend/.env` (gitignored). Never committed.
- CORS is explicitly configured — only the frontend origin is allowed.
- In production, secrets would be managed through a secrets manager (AWS Secrets
  Manager, HashiCorp Vault, or platform-level encrypted env vars) with automatic
  rotation, rather than a `.env` file on the server.
- All Setu API calls are server-side; the browser never sees the credentials or
  talks to Setu directly.
