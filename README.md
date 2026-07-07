# SignFlow

A small full-stack app to upload a PDF, create an e-signature request through
[Setu](https://setu.co/), track its status, and download the signed document.

The frontend never talks to Setu directly — all Setu credentials stay on the
backend. The browser only ever calls our own API.

## Architecture

```
Next.js (frontend)  ->  FastAPI (backend)  ->  Setu APIs
                              |
                              v
                         PostgreSQL
```

- **Frontend** (Next.js, TypeScript, Tailwind) — upload, status, landing pages.
- **Backend** (FastAPI) — proxies Setu, keeps keys server-side, persists metadata.
- **Database** (PostgreSQL) — stores each contract / signature request.

## Tech stack

| Layer    | Tech                                          |
|----------|-----------------------------------------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind 4  |
| Backend  | FastAPI, httpx, SQLAlchemy (async), asyncpg   |
| Database | PostgreSQL                                     |
| External | Setu Document / Signature APIs                 |

## Features

- Upload a PDF (max 10 MB) and create a signature request
- Open the Setu signing page in a new tab or inline
- Track signature status with real-time auto-polling
- Recent uploads loaded from the database
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
│   │   └── models.py        # Contract table
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── page.tsx         # landing
    │   ├── upload/          # upload page
    │   └── status/          # status page
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

Create `frontend/.env.local` from the example:

```bash
cp .env.local.example .env.local
```

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
| GET    | `/api/signature-status/{id}`   | Get status, update stored record     |
| GET    | `/api/download/{signature_id}` | Download signed PDF                   |

## How it works

1. The frontend uploads a PDF to `/api/upload-contract`.
2. The backend sends it to Setu (`/api/documents`), then creates a signature
   request (`/api/signature`), and saves the record to PostgreSQL.
3. The user signs via the returned signing link.
4. The status page polls `/api/signature-status/{id}`; the backend refreshes the
   stored status when Setu reports a change.
5. Once signed, the signed PDF is fetched through `/api/download/{signature_id}`.

## Notes

- Secrets live only in `backend/.env` (gitignored). Never commit real keys.
- CORS is limited to `http://localhost:3000` in development.
