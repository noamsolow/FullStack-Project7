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

Services can call provider adapters for PayPal and Gemini. Commerce checkout
explicitly selects either PayPal or database-backed LevGo tokens. Controllers never
run SQL, models never produce HTTP responses, and route files contain no
business rules.

Large workflows are divided by responsibility: order lifecycle is separate
from order checkout/payment, print operations are separate from print payment,
and structured recommendations are separate from conversational shopping help.

## Server boundaries

```text
server/
  index.js                 process bootstrap and graceful shutdown
  app.js                   Express composition
  config/                  environment parsing
  db/connection.js         single shared MySQL connection and transactions
  routes/                  HTTP method/path/middleware chains
  middleware/              auth, role, validation, uploads, rate limits
  controllers/             HTTP adapters
  services/                business rules and transactions
  models/                  parameterized SQL and row mapping
  integrations/            PayPal, SMTP, and Gemini adapters
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
- LevGo tokens are integer stored-value units; one token covers ILS 1.
- The server recalculates product prices, delivery fees, print quotes, and
  totals.
- Token balance rows are locked and debited in the same transaction that
  reserves stock and creates an order; every debit has a ledger row.
- PayPal credentials and OAuth tokens never reach the browser.
- PayPal checkout is available only when configured, and all provider captures
  are verified against the stored amount, currency, and order.
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
- Growing client lists use a shared Load More hook. Card-based screens append
  6 records per request and operational tables append 10.
- A filter or search change resets a list to page 1. Additional-page failures
  preserve records that were already loaded and can be retried.
- Models fetch `limit + 1` rows and use deterministic ordering to calculate
  `hasMore` without a separate count query.
- The client caches safe GET requests in memory, deduplicates concurrent loads,
  and invalidates affected prefixes after mutations.
- Related detail is loaded only when its route or panel opens.
- Growing maintenance comments and history are paginated independently after
  the ticket opens. Maintenance and vendor-delivery route planning process at
  most 50 tasks per batch and expose previous/next batch controls.
- Small reference collections that must be complete for a form or campus map
  remain bounded, full-list requests rather than Load More screens.
- Order, print, and ticket status updates use polling rather than WebSockets.
- Persisted carts use a user-public-ID namespace; the old shared cart key is
  discarded so one signed-in account cannot inherit another account's cart.
### Delivery tracking

Supplier dispatch starts persisted delivery tracking through a provider interface. The default demo provider assigns a 30-60 second ETA. A background reconciler and customer progress reads move due deliveries to `arrived` idempotently; client countdowns are visual only and never authorize completion.
