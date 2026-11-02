# LendLoop

> Borrow what you need. Lend what you don't.

A neighbourhood tool-lending board. Neighbours list tools, others request to borrow them, owners approve or decline, and automated notifications fire via n8n.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 · App Router · TypeScript (strict) |
| Auth | Clerk |
| Backend / DB | Convex |
| Automation | n8n (self-hosted, Docker) |
| Styling | Tailwind CSS |

---

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- [Clerk account](https://clerk.com) (free tier works)
- [Convex account](https://convex.dev) (free tier works)

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex dashboard → your deployment → Settings |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk dashboard → Webhooks → signing secret |
| `CONVEX_WEBHOOK_SECRET` | Generate: `openssl rand -hex 32` |
| `N8N_OVERDUE_TOKEN` | Generate: `openssl rand -hex 32` |
| `N8N_WEBHOOK_URL` | `http://localhost:5678/webhook/loan-event` (after n8n is running) |
| `N8N_PASSWORD` | Choose any password for the n8n UI |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Initialise Convex

```bash
npx convex dev
```

Follow the prompts to log in and create a new project. This generates `convex/_generated/` and gives you your `NEXT_PUBLIC_CONVEX_URL`.

### 3. Configure Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com).
2. Add your keys to `.env.local`.
3. In Clerk dashboard → **JWT Templates** → create a template named `convex` with the Convex JWT template preset. Copy the issuer domain into `convex/auth.config.ts` (`CLERK_JWT_ISSUER_DOMAIN`).
4. In Clerk dashboard → **Webhooks** → add an endpoint pointing to `https://your-domain/api/webhooks/clerk`. Enable `user.created` and `user.updated` events. Copy the signing secret to `CLERK_WEBHOOK_SECRET`. For local dev, use [ngrok](https://ngrok.com) or Clerk's built-in tunnel.

### 4. Start n8n

```bash
docker compose up -d
```

n8n will be available at `http://localhost:5678`. Log in with `admin` / `<N8N_PASSWORD>`.

### 5. Import n8n workflows

1. In n8n, go to **Workflows → Import from file**.
2. Import `n8n/workflow-request-notification.json`.
3. Import `n8n/workflow-overdue-reminders.json`.
4. Activate both workflows.

> n8n reads `CONVEX_WEBHOOK_SECRET`, `N8N_OVERDUE_TOKEN`, and `CONVEX_HTTP_URL` from the Docker environment, accessible inside workflows as `$env.*`.

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How it works

### Public view
Anyone can see the names and categories of available tools — no sign-in required.

### Authenticated flow
1. Sign in via Clerk.
2. **My Listings** — add tools, toggle availability, remove listings.
3. **All Tools** — filter by category and availability, request to borrow with a date range.
4. **Incoming Requests** — approve or decline requests on your own tools; mark loans as returned.
5. **My Requests** — track the status of your borrow requests.

### Overdue detection
Loans past their `endDate` with status `approved` are returned by the `/api/overdue` Convex HTTP endpoint. n8n fetches these daily and logs a reminder (swap the mock log node for a real email node to send actual emails).

---

## RBAC

Role checks are enforced in **every Convex mutation via `ctx.auth`** — not just in the UI.

| Operation | `user` | `admin` |
|---|---|---|
| Create/edit/remove own listings | ✓ | ✓ |
| Remove any listing | — | ✓ |
| Approve/decline/return own loans | ✓ | ✓ |
| View all loans | — | ✓ |
| Set user role | — | ✓ |
| Mark Trusted Lender | — | ✓ |

To make a user admin, call `users.setRole` from the Convex dashboard or a one-time script.

---

## Security

- **HMAC-SHA256** — Convex signs every outbound webhook payload; the `X-Webhook-Signature` header is verified in both the Next.js route (`app/api/webhooks/n8n/route.ts`) and the n8n workflow before processing.
- **Bearer token** — the Convex HTTP overdue endpoint requires `Authorization: Bearer <N8N_OVERDUE_TOKEN>`.
- **All secrets in env vars** — nothing is hardcoded. `.env.local` is gitignored.
- **Server-side auth** — all Convex mutations and queries that touch sensitive data call `requireAuth()` or `requireAdmin()` before any data access.

---

## TypeScript

```bash
npm run typecheck   # tsc --noEmit
```

Strict mode is on. No `any`.
