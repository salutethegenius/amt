# A.M.T Imports - Courier Business System

An online system for managing courier operations: customer management, order tracking, invoice generation, online payments, and email notifications.

## Features

- **Public Landing Page** - Company info, services, pricing, and contact details
- **Admin Dashboard** - Manage customers, orders, invoices, and payments
- **Customer Portal** - View orders, invoices, and pay online via Cash N' Go
- **Cash N' Go** - Card payments via Cash N' Go hosted checkout
- **Email Notifications** - Automated emails for invoices, payments, and order updates

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Database & Auth**: Supabase (Postgres + Auth + Row Level Security)
- **Payments**: Cash N' Go (Paylanes) card checkout
- **Email**: Resend
- **Backend**: FastAPI (optional, for extended features)
- **Deployment**: Docker

## Prerequisites

- Node 20+
- Python 3.11+ (for API service)
- Supabase project
- Cash N' Go merchant account (merchant ID + API key)
- Resend account

## Quick Start

### 1. Install dependencies

```bash
cd apps/web
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the required values:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (for admin operations) |
| `CNG_MERCHANT_ID` | Yes | Cash N' Go merchant AUTH_ID |
| `CNG_API_KEY` | Yes | Cash N' Go **Headers** API key (`apikey`), raw — not the URL-encoded copy |
| `CNG_BASE_URL` | No | Defaults to prod. Use `https://paylanes-qa.sprocket.solutions` for QA |
| `CNG_WEBHOOK_SECRET` | Yes (live) | HMAC-SHA256 secret for `POST /api/webhooks/cng` |
| `CRON_SECRET` | Yes (cron) | Bearer token for `GET /api/cron/cng-sync` |
| `RESEND_API_KEY` | Yes | Resend API key for email |
| `EMAIL_FROM` | Yes | Verified sender, e.g. `A.M.T Imports <billing@your-domain>` — not Resend onboarding |
| `ADMIN_EMAIL` | Yes | Admin notification inbox |
| `NEXT_PUBLIC_SITE_URL` | Yes (for live payments) | Public HTTPS origin for email links and Cash N' Go return URLs |
| `IMPORTABLE_API_KEY` | Yes (duty lookup) | Importable Bearer token for Bahamas tariff search on new orders/invoices |

### 3. Run locally

```bash
cd apps/web
npm run dev
```

Visit http://localhost:3000

### 4. Create your first admin user

1. Sign up at `/signup` with your work email.
2. In the AMT Supabase SQL editor, promote that profile (never pass `role` in user metadata — it is ignored):
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```
3. Enable **Leaked password protection** in Supabase Auth settings (HaveIBeenPwned).
4. Invite customers from **Dashboard → Customers → Invite / link**. They can also use `/signup` and `/forgot-password`.

## Project Structure

```
apps/web/src/
  app/
    page.tsx                        # Public landing page
    login/                          # Authentication
    dashboard/                      # Admin dashboard
      page.tsx                      # Overview with stats
      customers/                    # Customer CRUD
      orders/                       # Order management with status workflow
      invoices/                     # Invoice management (create, send, view)
      payments/                     # Payment history
    portal/                         # Customer portal
      page.tsx                      # Customer dashboard
      invoices/                     # View and pay invoices
      orders/                       # Track order status
    api/
      cng/checkout/                 # Create or reuse a pending checkout session
      cng/redirect/                 # 302 to PayLanes (API_KEY is required on this URL)
      cng/sync/                     # Admin CNG history sync
      cng/return/                   # Legacy CNG callback (redirects to public pages)
      webhooks/cng/                 # Signed PayLanes webhook
      cron/cng-sync/                # Daily CNG sync (CRON_SECRET)
    cng/return/success              # Public success page (display only)
    cng/return/cancel               # Public cancel page (display only)
    cng/return/error                # Public error page (display only)
    api/notify/invoice-sent/        # Email notification: invoice sent
    api/notify/order-status/        # Email notification: order status
  components/ui/                    # Shared UI components
  lib/
    supabase/                       # Supabase client helpers
    email/send.ts                   # Email sending utilities
    types.ts                        # TypeScript types and helpers
  proxy.ts                          # Auth + role-based route protection (Next.js 16 proxy)
```

## Database Schema

- **profiles** - User roles (admin/customer), extends Supabase Auth
- **customers** - Customer records managed by admins
- **orders** - Delivery orders with status tracking
- **invoices** - Customer invoices with line items
- **invoice_items** - Individual line items per invoice
- **invoice_payments** - Payment records (CNG fees/net/order number; `invoice_id` nullable for unmatched history)
- **checkout_sessions** - One pending Cash N' Go attempt per invoice
- **app_settings** - `cng_last_sync_at` only

## Client payment test

1. Admin sends an invoice linked to an order (existing test invoice: `INV-MMQDWHBX`).
2. Customer logs in → **My Orders** → open the order → **Pay Now**.
3. Complete the Cash N' Go card page. Return pages are display only.
4. PayLanes should POST to `https://<host>/api/webhooks/cng` (HMAC-SHA256 hex of the raw body). Admin **Payments → Sync from CNG** also settles processed orders if the webhook is late.
5. Admin checks **Payments** for a Cash N' Go row (unmatched history is labeled External).

For a remote client, `NEXT_PUBLIC_SITE_URL` must be the public HTTPS origin of the deployed app. Localhost only works if the payer is on that same machine.

Cash N' Go amounts must be greater than $1.00. Production charges are live card payments.

## Order Status Workflow

```
Processing -> Ready for Pickup -> Out for Delivery -> Completed
```

## Deploy

- **Docker**: `docker-compose up --build`
- **Vercel**: Connect repo, set root to `apps/web`, add env vars. Cron is in `apps/web/vercel.json` (`GET /api/cron/cng-sync` daily 06:00 UTC). Register PayLanes webhook `https://<host>/api/webhooks/cng`. Use production CNG keys only on Production — not Preview.
- **Railway**: Add web service from `apps/web`, add env vars

## Production go-live

Do this on AMT Supabase (`wggprtoukhqxfkuymtxd`) and Vercel Production only. Do not apply migrations or production CNG keys to Preview, BACO-DB, or Calabash.

1. **Vercel Production env** (not Preview for live CNG keys): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `CNG_MERCHANT_ID`, `CNG_API_KEY`, `CNG_BASE_URL` (prod PayLanes host), `CNG_WEBHOOK_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, `IMPORTABLE_API_KEY`.
2. **Vercel cron**: `CRON_SECRET` must be set so Vercel sends `Authorization: Bearer <CRON_SECRET>` to `GET /api/cron/cng-sync`.
3. **PayLanes webhook**: `https://<amt-host>/api/webhooks/cng` (HMAC-SHA256 of the raw body, `CNG_WEBHOOK_SECRET`).
4. **Auth dashboard**: enable [Leaked password protection](https://supabase.com/dashboard/project/wggprtoukhqxfkuymtxd/auth/protection) (HaveIBeenPwned). Add the production URL to Auth redirect allow-list (`/auth/callback`).
5. **Live QA** after deploy:
   - Pay Now → PayLanes → webhook marks the invoice paid
   - Duplicate Pay Now reuses the 60-minute checkout session
   - Cancel/error return pages do not mark paid
   - Payments → Sync from CNG recovers a missed webhook
   - Invite, signup, and forgot/reset password
   - A customer cannot see another customer’s invoices
