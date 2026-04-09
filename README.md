# ProTrack - Local Setup and Vercel Deployment (Neon DB)

This project is a Next.js app using Prisma + PostgreSQL.

## 1) Run locally

**Prerequisites**
- Node.js 20+
- A Neon database

**Steps**
1. Install dependencies:
   `npm install`
2. Create local env file:
   - PowerShell: `Copy-Item .env.example .env.local`
   - macOS/Linux: `cp .env.example .env.local`
3. Set `.env.local` values (at minimum `DATABASE_URL`, `NEXTAUTH_SECRET`, `GEMINI_API_KEY`).
4. Push schema to your database:
   `npm run db:push`
5. (Optional) Seed sample data:
   `npm run db:seed`
6. Start dev server:
   `npm run dev`

## 2) Create Neon database

1. In [Neon Console](https://console.neon.tech/), create a project + database.
2. Copy the **pooled connection string**.
3. Ensure your URL includes:
   - `sslmode=require`
   - `pgbouncer=true`

Example:

`postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connect_timeout=15`

## 3) Configure Vercel project

1. Import this GitHub repo into [Vercel](https://vercel.com/).
2. Framework preset: **Next.js** (auto detected).
3. Build command: `npm run build` (already configured in `vercel.json`).

## 4) Add Vercel environment variables

In **Project Settings -> Environment Variables**, add:

- `DATABASE_URL` = your Neon pooled connection string
- `NEXTAUTH_URL` = your production URL (for example `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` = a long random secret
- `GEMINI_API_KEY` = your Gemini API key
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (only if Google login is enabled)
- `APP_URL` = same as `NEXTAUTH_URL`

Generate a secret:

- Linux/macOS: `openssl rand -base64 32`
- Node (cross-platform): `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

## 5) Database schema in production

This repo currently uses `prisma db push` and does not include migration files.

For now, after adding env vars:
1. Deploy once on Vercel.
2. Run schema sync against production DB from your machine:
   - `DATABASE_URL="<your-neon-url>" npm run db:push`

Recommended next step for production reliability:
- Move to Prisma migrations (`prisma migrate dev` + `prisma migrate deploy`).

## 6) Deploy

1. Push your branch to GitHub.
2. Trigger deploy in Vercel (or enable auto deploy from `main`).
3. Open the deployed URL and verify:
   - auth works
   - API routes can read/write database
   - Gemini features work
