# Pedrito UI

Lightweight Next.js UI for reviewing and clearing your open loops. The app links to WhatsApp through our Intel Layer, fetches the latest loops, and lets you mark them done or dismiss them. Onboarding captures a few local preferences (focus, tone, cadence) in the browser.

## Prerequisites

- Node 18+
- npm

## Setup

1) Install deps:
```bash
npm install
```

2) Create `.env.local` with your services:
```
WHATSAPP_BASE_URL=http://localhost:3000
WHATSAPP_API_KEY=replace-me
INTEL_BASE_URL=http://localhost:4000
# INTEL_API_KEY=optional
NEXT_PUBLIC_SUPABASE_URL=replace-me
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-me
# Do not store service-role keys in this file
```

3) Run the dev server:
```bash
npm run dev
```
Open http://localhost:3000.

## Deploy

- Vercel: push to GitHub, set the env vars above in the Vercel project settings, then deploy.

## Notes

- Onboarding preferences are stored in `localStorage` only; no server profile is persisted yet.
- Avoid committing any `.env*` files; `.gitignore` already excludes them.
