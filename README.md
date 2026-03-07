# superguide_api

Backend API server for the Superguide application. Built with Hono, PostgreSQL (Drizzle ORM), and Firebase Auth.

## Setup

```bash
bun install
cp .env.example .env   # Configure environment variables
bun run dev            # Start dev server (port 8022)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `FIREBASE_PROJECT_ID` | Firebase project ID | required |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | required |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | required |
| `SITEADMIN_EMAILS` | Comma-separated admin emails | optional |
| `PORT` | Server port | `8022` |

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/users/:userId/histories` | Yes | List user histories |
| POST | `/api/v1/users/:userId/histories` | Yes | Create history |
| PUT | `/api/v1/users/:userId/histories/:id` | Yes | Update history |
| DELETE | `/api/v1/users/:userId/histories/:id` | Yes | Delete history |
| GET | `/api/v1/histories/total` | No | Global total |
| GET | `/health` | No | Health check |

## Database

Schema: `superguide`. Tables (`users`, `histories`) are created via raw SQL on startup -- no migration files.

## Commands

```bash
bun run dev            # Watch mode (bun --watch)
bun run build          # Build for production
bun run start          # Run built output
bun test               # Run Vitest tests
bun run typecheck      # TypeScript check
bun run lint           # ESLint
bun run verify         # All checks + build
```

## Related Packages

- **superguide_types** -- Shared type definitions
- **superguide_client** -- API client SDK that consumes these endpoints
- **superguide_lib** -- Business logic library
- **superguide_app** -- Web frontend
- **superguide_app_rn** -- React Native mobile app

## License

BUSL-1.1
