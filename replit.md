# Katheryne & Rainer — Invitaciones de Boda

A Spanish-language wedding invitation web app. Each guest gets a unique, tokenized invitation link (with a QR code) showing the couple's details, schedule, venue with a Google Maps link, dress code with color swatches, and an RSVP form. An admin panel manages guests, RSVPs, and the wedding configuration.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/wedding run dev` — run the wedding web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/wedding run typecheck` — typecheck just the web app (use this, not `build`, to verify)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React + Vite, wouter (routing), TanStack Query, framer-motion, Tailwind, shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/wedding` — frontend. Guest invitation at `src/pages/invitation.tsx`; admin at `src/pages/admin/*`; routes in `src/App.tsx`; ocean assets in `src/assets/`.
- `artifacts/api-server` — Express API; routes in `src/routes/` (e.g. `config.ts`, guests, invitation/rsvp).
- `lib/db/src/schema/` — Drizzle schema; source of truth for tables (`weddingConfig`, `guests`).
- `lib/api-spec/openapi.yaml` — **source of truth for the API contract.** Edit here, then run codegen.
- `lib/api-client-react` — generated React Query hooks + query keys (import from `@workspace/api-client-react`, not deep `/src/generated/*` paths).

## Architecture decisions

- Contract-first: change `lib/api-spec/openapi.yaml` and the DB schema, then run codegen + `pnpm --filter @workspace/db run push`. Don't hand-write client types.
- The config PATCH route spreads `parsed.data`, so adding an optional field to the spec + schema is enough — no route change needed.
- Invitation copy is fully Spanish; dates use `date-fns` `es` locale.
- Venue "Ver en Google Maps" uses the optional `mapsUrl` config field when set (restricted to `http(s)` schemes for safety); otherwise it generates a Google Maps search URL from venue + address.

## Product

- Per-guest tokenized invitations (`/invitation/:token`) with QR code, schedule, venue + map link, dress code, and RSVP (supports plus-one).
- Admin panel (`/admin`, `/admin/config`) to view guests/RSVP stats and edit wedding details.

## User preferences

_Populate as the user states preferences worth remembering across sessions._

## Gotchas

- wouter matches paths exactly by default. A wildcard like `<Route path="/admin*">` shadows nested routes (`/admin/config` → 404). Use explicit routes per page.
- The admin API (config + guest CRUD) currently has **no authentication** — any field set via admin (e.g. `mapsUrl`) is effectively public/attacker-settable. Treat admin-set strings as untrusted in the guest-facing UI.
- Verify the web app with `typecheck`, not `build` (build needs workflow-provided `PORT`/`BASE_PATH`).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
