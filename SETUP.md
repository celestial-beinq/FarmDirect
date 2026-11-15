# FarmDirect setup: Supabase, Paystack and security

This guide takes a fresh checkout to a working site: accounts, database,
payments and reviews. Do the steps in order. It takes about 20 minutes.

## What goes where

| Value | Where it lives | Visible in the browser? |
| --- | --- | --- |
| Supabase project URL | `.env` (root) | Yes — public by design |
| Supabase anon / publishable key | `.env` (root) | Yes — public by design |
| Supabase service-role key | Supabase only (functions get it automatically) | **Never** |
| Paystack secret key (`sk_...`) | Supabase function secrets | **Never** |

The two public values are safe to expose because the database's Row Level
Security decides what each visitor can read or change. The two secret values
never appear in this repository or in the website's code. The site does not
use a Paystack public key at all: customers pay on Paystack's own page.

`.env`, `supabase/functions/.env` and the generated
`src/environments/environment.ts` are all listed in `.gitignore`. Before your
first push, run `git status` and check none of them appear.

## 1. Create the Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. Open **SQL Editor**, paste the whole of
   `supabase/migrations/20261115000000_init.sql` and run it. This creates the
   tables, the security policies and the server-side rules.
3. Optional: paste and run `supabase/seed.sql` to add sample farms, produce
   and livestock so the marketplace is not empty. It is placeholder data.

## 2. Connect the website

1. Copy `.env.example` to `.env`.
2. In the Supabase dashboard open **Project Settings → API** and copy the
   **Project URL** and the **anon / publishable** key into `.env`.
3. Run `npm start`. The yellow "Supabase is not connected" banner disappears.

Always start and build with `npm start` / `npm run build` (not `ng serve`
directly): those commands generate the app's config from `.env` first, and
refuse to continue if a secret key has been pasted into it by mistake.

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

## 6. Make yourself an admin

Nobody can sign up as an admin. Create a normal account on the site first,
then run this in the Supabase **SQL Editor** with your email:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Sign out and back in; the account icon now opens the admin dashboard.

## 7. Try the whole flow

1. Sign up as a farmer. In the admin dashboard, verify the farm.
2. As the farmer, add a listing. As admin, approve it.
3. Sign up as a customer, add a delivery address, add produce to the basket
   and pay with a [Paystack test card](https://paystack.com/docs/payments/test-payments/).
4. As the farmer, confirm and dispatch the order. As the customer, confirm
   receipt — the product page now lets that customer leave a review.

## How the site is protected

- **Row Level Security on every table.** Customers see only their own orders
  and payments; farmers see only their own listings and their farm's orders;
  shoppers see only approved listings from verified farms.
- **Locked fields.** Database triggers stop anyone changing their own role or
  account status, verifying their own farm, or approving their own listing.
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
