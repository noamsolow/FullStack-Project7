# LevGo Architecture

## Product boundaries

LevGo has four deliberately separate workflows:

1. **Eat** and **Shop** use the commerce order pipeline.
2. **Print** uses a private-document, quote, payment, and collection pipeline.
3. **Report** uses a non-commercial maintenance ticket pipeline.
4. **Recommend** reads a small, safe catalog projection and can never mutate data.

The application covers Lev Campus only and uses English throughout.

## Layered request flow

```text
React page
  -> feature service
  -> generic Fetch client
  -> Express route
  -> middleware (request ID, auth, role, validation, upload)
  -> controller
  -> service
  -> model
  -> MySQL
```

Services also call provider adapters for PayPal and OpenAI. Controllers never
run SQL, models never produce HTTP responses, and route files contain no
business rules.

## Server boundaries

```text
server/
  index.js                 process bootstrap and graceful shutdown
  app.js                   Express composition
  config/                  environment parsing
  routes/                  HTTP method/path/middleware chains
  middleware/              auth, role, validation, uploads, rate limits
  controllers/             HTTP adapters
  services/                business rules and transactions
  models/                  parameterized SQL and row mapping
  integrations/            PayPal and OpenAI HTTP adapters
  validation/              Joi request contracts
  utils/                   errors, money, files, pagination, status rules
```

## Client boundaries

```text
client/src/
  app/                     router and providers
  layouts/                 public, customer, partner, admin shells
  pages/                   route-level orchestration
  features/                cart, auth, orders, printing, maintenance
  components/              small shared UI
  hooks/                   repeated stateful behavior
  services/                API access by resource
  utils/                   pure helpers and session storage
  styles/                  design tokens and responsive rules
```

## Authentication and authorization

- Customer type (`student` or `teacher`) is separate from operational role.
- Roles are `customer`, `vendor_manager`, and `admin`.
- JWT identity is reloaded from MySQL on every protected request.
- Ownership is checked inside services against the JWT user, never against a
  client-supplied owner ID.
- Customer, partner, and admin screens have separate login routes while sharing
  one authentication service.

## Money and payments

- All database and API money values are integer agorot.
- Currency is fixed to ILS.
- The server recalculates product prices, delivery fees, print quotes, and
  totals.
- PayPal credentials and OAuth tokens never reach the browser.
- Payment capture is idempotent and a successful provider result is reconciled
  against the stored amount and currency.
- Version 1 records paid cancellation requests but performs no automatic
  refund.

## File classes

- Product images are public after validation.
- Maintenance images are private to the reporter and administrators.
- Print PDFs are private to the owner, the selected print-center managers, and
  administrators.
- Validated file bytes are stored in MySQL `MEDIUMBLOB` columns.
- Original filenames are metadata only and are never used as filesystem paths.

## Data loading

- Every growing list is paginated with a server maximum of 50.
- The client caches safe GET requests in memory, deduplicates concurrent loads,
  and invalidates affected prefixes after mutations.
- Related detail is loaded only when its route or panel opens.
- Order, print, and ticket status updates use polling rather than WebSockets.
