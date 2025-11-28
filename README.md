# Recruit Planner

A simple, modern planner for recruitment ads and partners with per‑account data isolation, admin‑approved registration, and password reset.

## Overview
- Next.js App Router with a clean, glassy UI
- Admin approval for new registrations
- Password reset via email link
- Per‑user data: each account sees only its own partners and ads
- SQLite storage (no external DB required)

## Tech Stack
- Next.js 16 (Turbopack), App Router
- SQLite (`better-sqlite3`)
- Auth: `jose` (JWT), `bcryptjs`
- Email: `nodemailer` (SMTP)
- Styling: Tailwind CSS and components

## Quick Start
- Prerequisites: Node.js 18+, npm
- Install: `npm install`
- Development: `npm run dev` → opens at `http://localhost:3000`
- Build: `npm run build`
- Start (custom port): set `PORT`, then run your process manager (pm2/systemd) to serve the build

### Environment Variables
Set these in `.env` (production values required on a server):
- `AUTH_SECRET` — required; random string for JWT signing
- `DATABASE_PATH` — e.g. `/var/lib/recruit-planner/database.sqlite`
- `PORT` — e.g. `3001`
- `NEXT_PUBLIC_APP_URL` — public base URL (e.g. `https://your-domain.example`)
- `ADMIN_EMAIL` — address receiving approval emails
- `MAIL_FROM` — sender, e.g. `Recruit Planner <no-reply@your-domain>`
- SMTP (choose one pairing):
  - STARTTLS: `SMTP_HOST`, `SMTP_PORT=2525` (or 587), `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE=false`
  - Implicit TLS: `SMTP_HOST`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE=true`

## Authentication
- Registration creates a pending user and emails an admin approval link.
- Admin clicks approval link to activate the account.
- Login issues a `session` cookie (JWT). APIs read the cookie on Node runtime.
- Password reset: request a link, then set a new password via the reset page.

## Per‑Account Data
- `partners.user_id` and `ads.user_id` link data to the logged‑in user.
- Legacy data created before this change may lack `user_id`. To assign existing rows to a user:
  1) Find user id: `SELECT id FROM users WHERE username='your.username';`
  2) Assign partners: `UPDATE partners SET user_id=<USER_ID> WHERE user_id IS NULL;`
  3) Assign ads: `UPDATE ads SET user_id=<USER_ID> WHERE user_id IS NULL AND partner_id IN (SELECT id FROM partners WHERE user_id=<USER_ID>);`

## Deployment Notes
- Use Node runtime for API routes that access environment variables or Node‑only packages.
- Ensure `.env` is present and readable by the app process.
- Serve over HTTPS so the secure `session` cookie is sent.

## Troubleshooting
- 401 Unauthorized on dashboard:
  - Confirm login succeeded and a `session` cookie exists
  - Ensure `AUTH_SECRET` is set and matches the login environment
  - Use Node runtime for user‑scoped APIs
- Emails not sending:
  - Verify SMTP credentials and `MAIL_FROM` domain
  - Check port/security pairing (2525/587 + `SMTP_SECURE=false`, or 465 + `SMTP_SECURE=true`)
- Register/Forgot/Reset pages redirect to login:
  - Ensure the auth proxy/middleware allows `/register`, `/forgot-password`, `/reset`

## Scripts
- `npm run dev` — start development server
- `npm run build` — build for production
- `npm start` — start production server if defined by your process manager

