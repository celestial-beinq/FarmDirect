# FarmDirect setup: Supabase, Paystack and security

This guide takes a fresh checkout to a working site: accounts, database,
payments and reviews. Do the steps in order. It takes about 20 minutes.

## What goes where

| Value | Where it lives | Visible in the browser? |
| --- | --- | --- |
| Supabase project URL | `.env` (root) | Yes — public by design |
| Supabase publishable / anon key | `.env` (root) | Yes — public by design |
| Supabase service-role / `sb_secret_` key | Supabase only (Edge Functions) | **Never** |
| Paystack secret key (`sk_...`) | Supabase function secrets | **Never** |

The two public values are safe to expose because the database's Row Level
Security decides what each visitor can read or change, and all sensitive
operations (farmer KYC, payments, orders, Paystack calls) run behind RLS or
server-only Edge Functions. Secret keys never appear in this repository or in
the website's code. `scripts/set-env.mjs` rejects any `.env` containing secret
keys before a build can proceed.

`.env`, `supabase/functions/.env` and the generated
`src/environments/environment.ts` are all listed in `.gitignore`. Before your
first push, run `git status` and check none of them appear.

## 1. Create the Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. Apply **all** migrations in `supabase/migrations/` in filename order — either via CLI:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```
   or by pasting each `.sql` file in `supabase/migrations/` in chronological order into the Supabase **SQL Editor** (through `20261128000000_security_hardening.sql`).
3. **Turn off Email Confirmation during development** to avoid email rate limits:
   In your dashboard, go to **Authentication → Providers → Email** and toggle **Confirm email** to **OFF** (click Save). Remember to turn it back **ON** for production.
4. Optional: paste and run `supabase/seed.sql` to add sample farms, produce
   and livestock so the marketplace is not empty. It is placeholder data.

## 2. Connect the website

1. Copy `.env.example` to `.env`.
2. In the Supabase dashboard open **Project Settings → API Keys**, copy the **Project URL** into `SUPABASE_URL`, and copy your **Publishable key (`sb_publishable_...`)** into `SUPABASE_PUBLISHABLE_KEY` (or legacy `SUPABASE_ANON_KEY`).
3. Run `npm start`. The preview-mode banner disappears.

Always start and build with `npm start` / `npm run build` (not `ng serve`
directly): those commands generate the app's config from `.env` first, and
refuse to continue if any secret key (`service_role`, `sb_secret_`, `sk_live_`, `sk_test_`, DB passwords) has been pasted into `.env`.

## 3. Deploy the payment functions

Install the Supabase CLI (<https://supabase.com/docs/guides/cli>), then:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Secrets stay on the server. Use your own values.
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
supabase secrets set SITE_URL=http://localhost:4200
supabase secrets set ALLOWED_ORIGINS=http://localhost:4200

supabase functions deploy checkout
supabase functions deploy verify-payment
supabase functions deploy paystack-webhook
```

When the site goes live, set `SITE_URL` and `ALLOWED_ORIGINS` to your real
address (for example `https://farmdirect.ng`) and switch to your `sk_live_`
key. `ALLOWED_ORIGINS` can hold several addresses separated by commas.

## 4. Point Paystack at the webhook

In the Paystack dashboard open **Settings → API Keys & Webhooks** and set the
webhook URL to:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

This lets Paystack confirm payments even when a customer closes the tab
before returning to the site.

## 5. Supabase Auth settings

In **Authentication → URL Configuration**:

- **Site URL**: your site's address (`http://localhost:4200` while developing).
- **Redirect URLs**: add `http://localhost:4200/login` and, later, your live
  site's `/login`.

In **Authentication → Rate Limits**, keep the defaults or tighten them; this
is what slows down password guessing. Keep **Confirm email** switched on
(under Sign In / Providers → Email) so accounts need a real email address.

## 6. Create an Admin Account (Supabase Only)

Nobody can sign up as an admin from the website or via client `user_metadata` (`raw_user_meta_data` is forced to `customer` or `farmer`). An admin account can **only** be created or promoted from Supabase itself:

### Method A: Create user and promote via SQL Editor (Recommended)
1. In your Supabase Dashboard, go to **Authentication → Users → Add User → Create User** (or sign up normally on the site), enter the admin email and password, and check **Auto Confirm User?**.
2. Open the Supabase **SQL Editor** and run:
```sql
select public.make_admin('your-email@example.com');
```

### Method B: Server Admin API (`service_role` only)
From a trusted server script using your `service_role` / `sb_secret_` key, call `supabase.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: 'admin' }, user_metadata: { full_name: 'Admin Name' } })`.

When this user signs in on the website, they are immediately authenticated with the admin role and redirected to `/admin`.

## 7. Try the whole flow

1. Sign up as a farmer. In the admin dashboard, verify the farm.
2. As the farmer, add a listing. As admin, approve it.
3. Sign up as a customer, add a delivery address, add produce to the basket
   and pay with a [Paystack test card](https://paystack.com/docs/payments/test-payments/).
4. As the farmer, confirm and dispatch the order. As the customer, confirm
   receipt — the product page now lets that customer leave a review.

## How the site is protected

- **Row Level Security + least-privilege grants on every table.** Customers see
  only their own orders and payments; farmers see only their own listings and
  paid orders; shoppers see only approved listings from verified farms via
  `get_verified_farms()` with zero access to farmer PII or `owner_id`.
- **Isolated farmer KYC / PII.** National Identity Numbers (NIN), residential
  and farmland addresses, and verification documents live in `public.farm_kyc`,
  accessible only to the farm owner and admins.
- **Locked fields & safe signup trigger.** Database triggers stop anyone
  changing their own role or account status, verifying their own farm, or
  approving their own listing. Public sign-ups can never claim `'admin'` via
  `user_metadata`.
- **Orders and payments are server-only.** The browser cannot insert or edit
  orders, payments or pool totals. The `checkout` function re-prices every
  item from the database, so a tampered request cannot change what is charged.
- **Payments are verified with Paystack.** Orders are released only after the
  server confirms the payment with Paystack and checks the amount. Webhook
  calls must carry a valid Paystack signature.
- **Reviews are for real buyers.** The database only accepts a review from a
  customer with a delivered order containing that product, one per product.
- **Rate limiting.** Checkout and payment checks are limited per user, the
  webhook per address, new listings per farm, page requests per address, and
  sign-in attempts by Supabase Auth.
- **Limited origins.** The functions accept browser calls only from the
  addresses in `ALLOWED_ORIGINS`.
- **Security headers.** The web server sends a Content-Security-Policy and
  related headers that block framing and loading scripts from elsewhere.

## Before going live

- Use HTTPS for the site (your host normally provides it).
- Add your domain to `allowedHosts` in `angular.json`
  (`projects.FarmDirect.architect.build.options.security.allowedHosts`).
- If the site runs behind a load balancer, set the environment variable
  `TRUST_PROXY=1` so rate limiting counts real visitors.
- Turn on two-factor sign-in for your Supabase, Paystack and GitHub accounts.
- Refunds are not automated: cancelling a paid order in the admin dashboard
  does not return the money. Issue refunds from the Paystack dashboard.
