# FinShield Backend

Node.js/Express backend for authentication, user and organization management, invoice workflows, policy/terms handling, blockchain anchoring, and integration with the AI service.

## Features
- JWT-based authentication and session management
- Organization, user, assignment, and invoice APIs
- Blockchain anchoring flow support
- Swagger API documentation
- Redis queue workers and scheduled archival jobs
- AI service integration for invoice AI/OCR flows

## Tech Stack
- Node.js (ESM)
- Express
- MongoDB (Mongoose)
- Redis / BullMQ
- Socket.IO
- Swagger UI

## Project Structure
- `src/server.js` - HTTP bootstrap + DB connection + workers + cron
- `src/app.js` - Express app/middleware wiring
- `src/routes/` - Route modules
- `src/infrastructure/` - DB, queue, socket, and external integrations
- `src/modules/` - Domain controllers/services
- `src/seeders/` - Seeder scripts

## Prerequisites
### Local development
- Node.js 20+
- npm
- MongoDB
- Redis
- Running AI service (default: `http://localhost:8000`)

### Docker development
- Docker Desktop
- Docker Compose

## Environment Variables
This backend fails fast if required variables are missing.

Required variables:
- `NODE_ENV`
- `HOST`
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGIN`
- `PINATA_JWT`
- `PINATA_API_URL`
- `CHAIN_RPC_URL`
- `ANCHOR_PRIVATE_KEY`
- `ANCHOR_CONTRACT_ADDRESS`
- `AI_SERVICE_URL`
- `IPFS_GATEWAY_BASE`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`
- `REDIS_URI`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_USER_MAX`
- `RATE_LIMIT_AUTH_MAX`
- `RATE_LIMIT_UPLOAD_MAX`

Optional variable:
- `ANCHOR_CONFIRMATION` (defaults to `1`)

## Install and Run (Local)
1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Start production mode locally:
```bash
npm start
```

Default health URL:
`http://localhost:5000/health`

## Run with Docker Compose
From the `BACKEND` folder:
```bash
docker compose up --build
```

Services started:
- `backend` on port `5000`
- `redis` on internal service host `redis:6379`

Stop services:
```bash
docker compose down
```

## API Documentation
- Swagger UI: `GET /api-docs`
- OpenAPI JSON: `GET /api-docs/json`

## Main Route Groups
- Public:
  - `GET /health`
  - `/auth` (login and auth flows)
  - `/session`
- Protected (require auth):
  - `/organization`
  - `/user`
  - `/assignment`
  - `/invoice`
  - `/blockchain`
  - `/audit-logs`
  - `/policy`
  - `/terms`

## Seeder Commands
- Create super admin:
```bash
npm run seed:super-admin
```

- Seed full system:
```bash
npm run seed:full-system
```

- Seed Hamish policies:
```bash
npm run seed:hamish-policies
```

- Seed terms:
```bash
npm run seed:terms
```

## Integration Notes
- Backend calls AI service through `AI_SERVICE_URL`.
- In Docker Compose, backend uses `http://host.docker.internal:8000` by default.
- Ensure AI service is reachable before invoice AI-dependent flows.

## Troubleshooting
- Startup error for missing env var:
  - Add the missing key in `.env` and restart.
- Mongo connection errors:
  - Verify `MONGO_URI` and MongoDB availability.
- Redis queue issues:
  - Verify `REDIS_URI` and Redis health.
- AI integration errors:
  - Confirm `AI_SERVICE_URL` points to an accessible AI service endpoint.
