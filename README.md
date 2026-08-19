# A.M.T Imports - Courier Business System

An online system for managing courier operations: customer management, order tracking, invoice generation, online payments, and email notifications.

## Features

- **Public Landing Page** - Company info, services, pricing, and contact details
- **Admin Dashboard** - Manage customers, orders, invoices, and payments
- **Customer Portal** - View orders, invoices, pay online, and download receipts
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
| `CNG_BASE_URL` | No | Defaults to `https://paylanes.sprocket.solutions` |
| `RESEND_API_KEY` | Yes | Resend API key for email |
| `EMAIL_FROM` | No | Sender email (defaults to Resend onboarding) |
| `ADMIN_EMAIL` | No | Admin notification email |
| `NEXT_PUBLIC_SITE_URL` | Yes (for live payments) | Public URL used for email links and Cash N' Go return redirects |

### 3. Run locally

```bash
cd apps/web
npm run dev
```

Visit http://localhost:3000

### 4. Create your first admin user

1. Sign up at `/login`
2. In Supabase SQL Editor, update your profile role:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```

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
      cng/checkout/                 # Cash N' Go hosted checkout URL
      cng/return/                   # Legacy CNG callback (redirects to public pages)
    cng/return/success              # Public success page (always 200 HTML)
    cng/return/cancel               # Public cancel page (always 200 HTML)
      notify/invoice-sent/          # Email notification: invoice sent
      notify/order-status/          # Email notification: order status
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
- **invoice_payments** - Payment records

## Client payment test

1. Admin sends an invoice linked to an order (existing test invoice: `INV-MMQDWHBX`).
2. Customer logs in → **My Orders** → open the order → **Pay Now**.
3. Complete the Cash N' Go card page. The app verifies the payment with the transaction API before marking the invoice paid.
4. Admin checks **Payments** for a Cash N' Go row.

For a remote client, `NEXT_PUBLIC_SITE_URL` must be the public HTTPS origin of the deployed app. Localhost only works if the payer is on that same machine.

Cash N' Go amounts must be greater than $1.00. Production charges are live card payments.

## Order Status Workflow

```
Processing -> Ready for Pickup -> Out for Delivery -> Completed
```

## Deploy

- **Docker**: `docker-compose up --build`
- **Vercel**: Connect repo, set root to `apps/web`, add env vars
- **Railway**: Add web service from `apps/web`, add env vars
