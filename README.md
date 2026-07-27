# LevGo

LevGo is an English-only commerce and campus-services platform for Machon Lev.
Students and teachers can order food and supplies, submit private PDF print
jobs, and report maintenance issues. Vendor managers run their own storefront
or print center, while administrators handle campus operations and access.

## Included workflows

- **Eat and Shop:** public catalogs, one-vendor cart, pickup or
  building-specific delivery, PayPal checkout, stock reservations, pickup
  codes, and polling-based status tracking.
- **Print:** private PDF upload, staff quote, PayPal payment, printing
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
MySQL, Multer, PayPal Orders v2, OpenAI Responses API, ESLint, Node tests,
Postman, and Git.

No ORM, MongoDB, Redux, Tailwind, JSON Server, FAJAX, or WebSockets are used.

## Project map

```text
client/       React single-page application and responsive design system
server/       Express routes, middleware, controllers, services, repositories
database/     MySQL schema, official campus locations, demo catalog, grants
docs/         Architecture, permissions, API contract, and threat model
postman/      Importable local API collection and environment
```

Read [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md),
[permissions](docs/PERMISSIONS.md), [API contract](docs/API.md), and the
[ERD](database/ERD.md) before extending a workflow.

## Local setup

Requirements:

- Node.js 22 or newer
- MySQL 8
- PayPal Developer sandbox credentials for real checkout testing
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

Create the development accounts after the schema and catalog seed:

```powershell
npm.cmd --prefix server run seed:users
```

The example environment creates:

| Portal | Email | Development password |
|---|---|---|
| Customer | `student@jct.ac.il` | `StudentPass123!` |
| Partner | `partner@example.com` | `PartnerPass123!` |
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

For PayPal, create a sandbox REST application and set
`PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`. LevGo creates and captures Orders v2
payments only on the server, uses ILS, and verifies provider order ID, owner,
amount, currency, and capture state.

For OpenAI, set `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to the configured
current model in `.env.example`. Without a key—or when the provider is
unavailable—the recommendation endpoint returns a clearly labeled,
deterministic catalog fallback.

## Verification

```powershell
npm run lint
npm test
npm run build
```

The Node suite covers file signatures, money conversion, status transitions,
server-authoritative checkout validation, and password rules. Full transaction,
ownership, and concurrency verification requires a running MySQL test
database. Import the Postman artifacts for end-to-end API checks.

## Version-one limits

Lev Campus only; English only; no email verification, automated refunds,
vendor payouts, GPS tracking, scheduled orders, reviews, promotions, or
WebSockets. PayPal sandbox is used during development. Uploaded PDFs are not
malware-scanned in this classroom version and must be scanned before a
production print workflow.
