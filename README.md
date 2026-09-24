# vegan-grove-web

The web app for [Vegan Grove](https://vegangrove.org): a privacy-first vegan community and activism platform for Southern California. Public pages for places, events, groves, media, and guides; an authenticated area for the feed, messages, friends, the companion, and settings.

Read `SOUL.md` and `PRODUCT-PRINCIPLES-CHECKLIST.md` before changing anything. Privacy rules and the design tokens are binding.

## Stack

Next 15 (App Router, TypeScript, `src/`), Tailwind 4 with shadcn/ui on top of the `--vg-*` tokens, `next-themes` (dark by default, light works), MapLibre GL with OpenFreeMap tiles, Biome, Playwright. No analytics, no third-party fonts, no icon CDNs.

## Run

```
nvm use            # Node 24
npm ci
cp .env.example .env.local   # fill in what you need; the dev defaults work with the API on :4000
npm run dev
```

The app expects the API from `vegan-grove-api` at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000/api`). Every public page renders an honest empty state when the API is unreachable, so the site runs without it.

## Environment

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | API base including `/api`. Its origin is added to the CSP `connect-src`. |
| `NEXT_PUBLIC_MEDIA_CDN_ORIGIN` | Origin that serves uploaded images. Added to `img-src`, `media-src`, and `images.remotePatterns`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, `robots.txt`, `sitemap.xml`, `llms.txt`. |
| `SESSION_COOKIE_SECURE` | Force the cookie `Secure` flag on or off. Unset means secure in production only. |

Names only in `.env.example`. Never commit a `.env` file.

## Validate

```
npm run validate   # biome check, tsc --noEmit, next build
npm run test:e2e   # Playwright smoke (chromium); run `npx playwright install chromium` once
```

`validate` is the CI contract and must be green before a push. Husky runs Biome on staged code and `secretlint` on every staged file.

## Where things live

- `src/app/(site)/` public pages sharing the header and footer
- `src/app/app/` the authenticated area (sidebar layout, validates the session against the API)
- `src/app/api/session/route.ts` the only place the session token is handled; sets and clears the httpOnly `vg_session` cookie
- `src/middleware.ts` redirects `/app/*` without a cookie to `/login?next=`
- `src/lib/api.ts` the one HTTP client; `src/lib/api.server.ts` forwards the cookie as a bearer token on the server
- `src/components/ui/` shadcn components; `src/components/screen.tsx` the Context / Action / Support layout every screen uses
- `src/app/globals.css` brand tokens and the shadcn mapping; no other file defines a color
- `next.config.ts` security headers (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy)

## Deploy

AWS Amplify Hosting (WEB_COMPUTE) from `amplify.yml`: the preBuild step copies `NEXT_PUBLIC_*` and `SESSION_*` variables from the Amplify environment into `.env.production`, then `npm ci` and `npm run build`. Artifacts are `.next`; `node_modules` and `.next/cache` are cached between builds. Set the environment variables in the Amplify console, never in the repo.

## Related repos

- `vegan-grove-api` the Express API this app talks to
- `vegan-grove-mobile` the Expo app
- `vegan-grove-docs` product, privacy, and architecture docs at https://docs.vegangrove.org
