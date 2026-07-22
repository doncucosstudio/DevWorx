# Food Truck Orders

An online ordering app for food trucks. Each truck gets its own branded page,
customizable menu (categories, items, and modifier/add-on groups), a cart and
checkout flow, live order status tracking, and an admin dashboard for the
truck owner to manage everything and run the order queue.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + SQLite (file-based, zero setup)
- Zustand for cart state (persisted in the browser)

## Getting started

```bash
npm install
npm run db:seed   # creates the SQLite DB and seeds two example trucks
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse trucks as a
customer, and [http://localhost:3000/admin](http://localhost:3000/admin) to
manage them.

The admin password is set via `ADMIN_PASSWORD` in `.env` (defaults to
`changeme123` — change this before deploying). See `.env.example`.

## What's customizable

Everything is managed from `/admin` — no code changes needed:

- **Branding**: logo (emoji or image URL), primary/secondary/accent colors,
  font style, and corner style (sharp/rounded/pill) — applied live to that
  truck's public menu, cart, and order pages.
- **Menu**: unlimited categories, items (price, description, photo/emoji,
  availability, "popular" badge), and per-item modifier/add-on groups with
  required/optional and min/max selection rules.
- **Operations**: open/closed toggle, location, hours text, estimated wait
  time, tax rate, currency symbol, and order number prefix.
- **Multiple trucks**: run as many independent trucks as you like from one
  deployment, each with its own URL slug, menu, and theme.

## Order flow

Customers pick a truck, customize items, and check out with just a name and
phone number (no payment processing is wired up — add a processor like
Stripe if you need real payments). They land on a live order-status page
that polls for updates. Truck owners manage the queue at
`/admin/trucks/[id]/orders` and advance orders through
Pending → Preparing → Ready → Completed (or cancel).

## Useful scripts

```bash
npm run dev        # start the dev server
npm run build       # production build
npm run db:seed     # reset and seed the database with example data
npm run db:reset     # drop and re-apply all migrations
```
