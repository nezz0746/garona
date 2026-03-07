# Garona

A trust-based social network built with Expo (React Native for web & mobile) and Hono.

Users earn ranks through community vouching, unlocking features progressively:

| Rang | Titre  | Capacites                    |
| ---- | ------ | ---------------------------- |
| 1    | Membre | Suivre, liker                |
| 2    | Actif  | Poster, commenter            |
| 3    | Proche | Messages prives              |
| 4    | Leader | Organiser                    |
| 5    | Ancien | Moderer                      |

## Stack

- **Mobile/Web** — Expo (React Native), Expo Router
- **API** — Hono on Node.js
- **Auth** — Better Auth (passkeys via WebAuthn)
- **Database** — PostgreSQL with Drizzle ORM
- **Monorepo** — pnpm workspaces + Turborepo

## Structure

```
apps/
  api/          Hono API server (auth, feed, profiles, vouches, uploads)
  mobile/       Expo app (web + iOS + Android)
packages/
  db/           Drizzle schema, migrations, seed
  shared/       Theme, constants, mock data
  ui/           Shared UI components (Avatar, IconButton, etc.)
```

## Setup

```bash
pnpm install

# Start Postgres (e.g. via Docker)
# Set DATABASE_URL in packages/db/.env or environment

# Run migrations & seed
pnpm --filter @garona/db run migrate
pnpm --filter @garona/db run seed

# Dev
pnpm run dev
```

## Environment variables

| Variable             | Description                          | Default                    |
| -------------------- | ------------------------------------ | -------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string         | `postgresql://garona:garona@localhost:5433/garona` |
| `BETTER_AUTH_URL`    | API base URL for Better Auth         | `http://localhost:3001`    |
| `BETTER_AUTH_SECRET` | Encryption secret (min 32 chars)     | —                          |
| `PASSKEY_RP_ID`      | WebAuthn relying party ID            | `localhost`                |
| `PASSKEY_ORIGIN`     | WebAuthn expected origin             | `http://localhost:8081`    |

## Scripts

```bash
pnpm run dev          # Start all apps in dev mode
pnpm run build:api    # Build the API
pnpm run start:api    # Start the API (production)
pnpm run build:web    # Build web app
pnpm run check:fix    # Lint & format with Biome
```
