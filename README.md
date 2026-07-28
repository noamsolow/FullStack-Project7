# LevGo

LevGo is an English-only commerce and campus-services platform for Machon Lev.
Students and teachers can order food and supplies, submit private PDF print
jobs, and report maintenance issues. Vendor managers run their own storefront
or print center, while administrators handle campus operations and access.

## Included workflows

- **Eat and Shop:** public catalogs, one-vendor cart, pickup or
  building-specific delivery, server-verified totals, pickup codes, and
  polling-based status tracking. Online payment is currently disabled.
- **Print:** private PDF upload, staff quote, customer approval, printing
  lifecycle, pickup code, and 30-day retention metadata.
- **Report:** categorized maintenance reports, private photos, comments,
  priority, assignment, and status history.
- **Recommend:** OpenAI Responses API with structured output and a deterministic
  local fallback. Only pre-filtered product IDs are accepted.
- **Portals:** separate customer, partner, and administrator login experiences
  with API-enforced ownership and role checks.

## Course technology

React, React Router, Context, Fetch, LocalStorage, sessionStorage, semantic
HTML, CSS Grid/Flexbox/media queries, Node.js, Express, Joi, JWT, bcrypt,
MySQL, Multer, OpenAI Responses API, ESLint, and Git. The PayPal adapter remains
available behind the disabled `PAYMENTS_ENABLED` feature flag.

No ORM, MongoDB, Redux, Tailwind, JSON Server, FAJAX, or WebSockets are used.

## Project map

```text
client/       React single-page application and responsive design system
server/       Express routes, middleware, controllers, services, and models
database/     MySQL schema, uploaded file bytes, campus data, and grants
a_instructions/docs/
              Architecture, permissions, API contract, and threat model
```

Read [architecture](a_instructions/docs/ARCHITECTURE.md),
[security](a_instructions/docs/SECURITY.md),
[permissions](a_instructions/docs/PERMISSIONS.md),
[API contract](a_instructions/docs/API.md), and
the MySQL definitions in `database/schema.sql` before extending a workflow.

## Local setup

Requirements:

- Node.js 22 or newer
- MySQL 8
- An OpenAI API key only if live AI recommendations are desired

Install packages:

```powershell
npm run install:all
```

Create the database with a MySQL administrator:

```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
SOURCE database/grants.sql;
```

Replace the password in `database/grants.sql` before running it. Copy
`server/.env.example` to `server/.env`, set the same database password, and
replace every development secret. Copy `client/.env.example` to
`client/.env`.

`database/seed.sql` creates the following classroom demo accounts only when
their email addresses do not already exist:

| Portal | Email | Development password |
|---|---|---|
| Customer | `student@jct.ac.il` | `StudentPass123!` |
| Meat cafeteria partner | `partner@example.com` | `PartnerPass123!` |
| Dairy cafeteria partner | `dairy.partner@example.com` | `PartnerPass123!` |
| Office supplies partner | `office.partner@example.com` | `PartnerPass123!` |
| Print center partner | `print.partner@example.com` | `PrintPartnerPass123!` |
| Admin | `admin@jct.ac.il` | `AdminPass123!` |

Change these values outside a local classroom environment.

Start the API and client in separate terminals:

```powershell
npm run dev:server
npm run dev:client
```

Open `http://localhost:5173`. The API health endpoint is
`http://localhost:3000/api/health`.

## Provider configuration

Online payment is disabled by default with `PAYMENTS_ENABLED=false`. Orders are
placed immediately after server-side price, delivery-zone, and stock
validation. Print quotes are confirmed without an online charge. The dormant
PayPal adapter can be restored later by configuring sandbox credentials and
setting the flag to `true`.

For OpenAI, set `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to the configured
current model in `.env.example`. Without a key—or when the provider is
unavailable—the recommendation endpoint returns a clearly labeled,
deterministic catalog fallback.

## Verification

```powershell
npm run lint
npm run build
```

Full transaction, ownership, payment, and concurrency verification requires a
running local MySQL database and the relevant provider sandboxes.

Validated product images, print PDFs, and maintenance photos are stored as
binary data in MySQL. Their names, types, sizes, ownership, and access rules
remain in the related file tables.

## Version-one limits

Lev Campus only; English only; no email verification, automated refunds,
vendor payouts, GPS tracking, scheduled orders, reviews, promotions, or
WebSockets. Online payment is disabled in the current classroom flow. Uploaded PDFs are not
malware-scanned in this classroom version and must be scanned before a
production print workflow.
