# AGENTS.md

All coding agents working in this repository must follow this order:

1. Read `SOUL.md`.
2. Read `PRODUCT-PRINCIPLES-CHECKLIST.md`.
3. Then implement changes.

## Non-negotiables

- Privacy first. No new personal data without an entry in the data inventory. Profiles are never public. Nothing personal reaches logs or third parties.
- The principal comes from the session, never from a request body.
- Every list is filtered by visibility on the server.
- Use the shared design tokens. No new hex colors, no third-party fonts.
- Reliable over flashy. Smaller scope with tests beats larger scope without.
- Never commit secrets, `.env` files, `ios/`, `android/`, or infrastructure identifiers. `secretlint` runs on every commit; treat a finding as a stop.

## Before proposing completion

Run `npm run validate` and provide:

- What activist outcome improved.
- What privacy and trust checks were run.
- What metric or feedback signal should be monitored.

If uncertain, choose the smaller scope and ask for review.

## Commit and PR conventions

- Conventional commit subjects (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- Squash merges into `main`. The `validate` check must be green.
- Copy the PR summary block from `PRODUCT-PRINCIPLES-CHECKLIST.md` into every PR.

## This repository

<!-- REPO-SPECIFIC: purpose, layout, run commands, where things live, what not to touch -->

`vegan-grove-web` is the Next 15 App Router site at `vegangrove.org`. It is a client of `vegan-grove-api`; it owns no data and never talks to a database.

**Run:** `npm ci`, `npm run dev`. **Check:** `npm run validate` (Biome, `tsc --noEmit`, `next build`). **Smoke:** `npm run test:e2e` (Playwright, chromium). Node 24.

**Layout.** `src/app/(site)/` holds the public pages under the shared header and footer. `src/app/app/` is the authenticated area with the sidebar; its layout validates the session with `GET /api/me`. `src/app/api/session/route.ts` is the only code that sees the session token: it proxies login, magic-link verify, and register to the API and sets the httpOnly `vg_session` cookie. `src/middleware.ts` bounces `/app/*` without a cookie. `src/lib/api.ts` is the one HTTP client (`apiFetch`); `src/lib/api.server.ts` adds the cookie as a bearer token for server components. `src/lib/types.ts` mirrors the API resources the site reads.

**Design.** `src/app/globals.css` declares the `--vg-*` tokens and maps them onto shadcn's semantic variables; components use semantic classes or `vg-*` colors only. `src/components/screen.tsx` is the Context / Action / Support layout every page uses. shadcn components live in `src/components/ui/` (Base UI primitives, added with `npx shadcn@latest add <name>`). Icons come from `lucide-react`. System fonts only. Dark is the default theme; light must keep working.

**Rules specific to this repo.**

- Never render a profile page or any route keyed by a user id. A public-posts view for a handle is allowed by privacy rule 1 and is not built yet (see the comment in `src/app/app/feed/page.tsx`).
- The session token never reaches browser JavaScript. Do not return it from the session route, do not store it in `localStorage`, do not read the cookie on the client.
- Map queries send a bounding box. Device location is used only to center the map in the browser.
- Any new external origin (CDN, embed, API) must be added to the CSP in `next.config.ts` and justified in the PR.
- No analytics, tracking pixels, tag managers, third-party fonts, or icon CDNs. Before proposing completion, grep the tree for any analytics SDK, tag-manager domain, or hosted-font host; every hit is a stop.
- Public pages fall back to an empty state when the API is down. Do not turn a fetch failure into a 500.
- Do not touch `src/components/ui/*` by hand beyond formatting; regenerate through the shadcn CLI so upgrades stay clean.
