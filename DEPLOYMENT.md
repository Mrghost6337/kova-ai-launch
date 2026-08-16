# Deploying KOVA AI to Vercel

This app has two parts that get hosted separately:

| Part | What it is | Where it runs |
| --- | --- | --- |
| **Frontend** | This Vite + React site (landing, pricing, auth, dashboard) | **Vercel** (static hosting, CDN, custom domain) |
| **Backend + database** | All `src/convex/*` functions: auth, waitlist, Stripe checkout, purchases | **Convex cloud** (not Vercel — Vercel only serves static files) |

`vercel.json` is already configured in this repo:

```json
{
  "installCommand": "bun install",
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/((?!assets/|.*\\..*).*)", "destination": "/index.html" }]
}
```

The SPA rewrite makes deep links like `/dashboard`, `/pricing`, and `/checkout/success` work on refresh. The production build was verified locally (`tsc -b && vite build` → `dist/`), and the generated Convex types live in `src/convex/_generated/` so the build does not need Convex credentials on Vercel's servers.

---

## What you need first (5 minutes)

1. **Vercel account** — free at [vercel.com](https://vercel.com). This is the only account strictly required to launch the site.
2. **This project in a Git repo you own** (GitHub, GitLab, or Bitbucket). Export/download the project from Freebuff, then push it to your repo.
3. **A Convex account** (recommended, free at [convex.new](https://convex.new)) — the backend needs a *production* deployment you own. The backend currently wired to this sandbox is a development deployment that can be reset at any time, so don't build a launch on it.
4. **`kova.ai` domain** — only if you want the custom domain. You can launch on a free `*.vercel.app` URL first and attach the domain later.

---

## Step 1 — Get a production Convex backend

Do this in a local copy of the repo (terminal):

```bash
npx convex dev --once      # links the repo to your Convex project
npx convex deploy          # deploys the backend to production
```

When it finishes, note the production deployment URL — it looks like `https://<project>-<something>.convex.cloud`. **Keep this URL; you'll need it in Step 2.**

> Alternative (fastest, only if you accept the risk): skip your own Convex deployment and point the site at the existing sandbox backend `https://lovable-alligator-542.convex.cloud`. Fine for testing, not for launch — dev deployments can be wiped.

### Environment variables on the Convex backend

Open your Convex project → **Settings → Environment Variables** and set:

| Variable | Value | Used by |
| --- | --- | --- |
| `SITE_URL` | `https://kova-ai.vercel.app` (or your custom domain) | Stripe success/cancel redirects (`checkout.ts`) |
| `STRIPE_SECRET_KEY` | your Stripe **secret** key (`sk_live_...`) | Checkout + webhooks |
| `STRIPE_WEBHOOK_SECRET` | your Stripe webhook signing secret (`whsec_...`) | Webhook signature verification |
| `VLY_INTEGRATION_KEY` | the Vly integrations key used for waitlist emails | `waitlistEmail.ts` |
| `VLY_APP_NAME` | `KOVA AI` (optional) | Branding in OTP emails |
| `VLY_CONVEX_AUTH_ISSUER` | leave unset (defaults to `https://auth.freebuff.app`) | Convex Auth JWT issuer |

(`CONVEX_SITE_URL` and `CONVEX_URL` are set automatically by Convex — do not add them.)

## Step 2 — Deploy the frontend to Vercel

**Option A — Git import (recommended):**

1. Push this project to GitHub/GitLab/Bitbucket.
2. Go to **vercel.com → Add New → Project → Import** the repo.
3. Vercel auto-detects Vite. The `vercel.json` in the repo sets the install, build, and output config, so you don't need to change anything on the import screen.
4. Under **Environment Variables**, add:
   - `VITE_CONVEX_URL` = your production Convex URL from Step 1 (e.g. `https://your-project-123.convex.cloud`)
5. Click **Deploy**. First deploy takes ~1–2 minutes.

**Option B — Vercel CLI (no Git needed):**

```bash
npm i -g vercel
vercel login
# from the project folder:
vercel --prod
```

When prompted, link/create a project and add `VITE_CONVEX_URL` when asked (or set it in the Vercel dashboard afterwards and redeploy).

> The `VITE_CONVEX_URL` value is inlined into the JS bundle at build time, so the site and the backend must point at the same deployment. If you change Convex deployments, redeploy the frontend too.

## Step 3 — Attach `kova.ai` (custom domain)

1. In the Vercel dashboard → your project → **Settings → Domains** → add `kova.ai` (and `www.kova.ai`).
2. Vercel shows the DNS records to add at your domain registrar (an `A`/`ALIAS` record for the apex and a `CNAME` for `www`). Add them, then wait for propagation (usually minutes to a few hours).
3. Once the domain shows **Valid**, update the Convex `SITE_URL` env var to `https://kova.ai` and redeploy the backend (`npx convex deploy`), then redeploy the frontend on Vercel so `VITE_CONVEX_URL` matches the same backend.

## Step 4 — Stripe webhook (only if payments are live)

1. In the Stripe dashboard → **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-site>/stripe/webhook`
   - Event: `checkout.session.completed`
2. Copy the `whsec_...` signing secret into the Convex `STRIPE_WEBHOOK_SECRET` env var (Step 1).

## Step 5 — Verify

- Visit your site, sign up, and confirm the email OTP arrives.
- Open `/pricing`, start a checkout, and confirm the Stripe success page redirects to `/checkout/success`.
- Confirm deep links (`/dashboard`, `/pricing`) don't 404 on refresh (the SPA rewrite handles this).
