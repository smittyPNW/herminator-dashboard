# Herminator Dashboard

A polished Next.js operator console for a local Hermes installation.

It provides a visual control room for:

- gateway health and restart controls
- cron jobs and scheduler actions
- profile switching
- skill browsing, search, and install
- session and log inspection
- live chat routing through Hermes and local model fallbacks

## Highlights

- Distinct synthwave control-room UI rather than generic admin styling
- Real Hermes-backed actions instead of mocked dashboard buttons
- Mobile navigation and responsive operator shell
- Native Hermes profile and skill integration

## Requirements

- Node.js 18+
- A working local Hermes install
- Hermes CLI and Hermes files available at `HERMES_DIR`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env config:

```bash
cp .env.example .env.local
```

3. Update `.env.local`:

- `DASHBOARD_PASSWORD`: the password used to access the dashboard
- `AUTH_SECRET`: a long random string used to sign the auth cookie
- `HERMES_DIR`: absolute path to the Hermes home directory you want to inspect

Example:

```env
DASHBOARD_PASSWORD=your-dashboard-password
AUTH_SECRET=your-long-random-secret
HERMES_DIR=/path/to/.hermes
APP_ORIGIN=http://localhost:3000
```

4. Start the app:

```bash
npm run dev
```

5. Open the dashboard:

`http://localhost:3000`

## Production

Build and run:

```bash
npm run build
npm run start
```

The app reads live Hermes state from `HERMES_DIR`, so production use is best on the same machine that runs Hermes or on a trusted internal network.

## Environment Notes

- This project intentionally does not commit `.env.local`.
- If you ever committed real secrets before adding `.gitignore`, rotate them before publishing.
- Chat fallback behavior depends on the Hermes installation and any provider keys configured inside the Hermes `.env`.

## Architecture

- `src/lib/hermes.ts`
  Hermes filesystem and CLI integration layer
- `src/app/api/*`
  Server routes for gateway, auth, skills, chat, and admin actions
- `src/components/*`
  Dashboard UI, controls, navigation, and operator panels
- `src/app/*`
  Main pages for dashboard, chat, cron, config, skills, logs, and sessions

## Publish Checklist

- Set your own `DASHBOARD_PASSWORD` and `AUTH_SECRET`
- Confirm `HERMES_DIR` points to your own Hermes install
- Review screenshots and branding
- Add a license before open-sourcing if you want explicit reuse terms
