# LevGo API Contract

Base URL: `http://localhost:3000/api`

## Envelope

Successful responses use:

```json
{ "data": {}, "meta": {} }
```

Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [],
    "requestId": "uuid"
  }
}
```

Protected routes require `Authorization: Bearer <jwt>`. JWT identity is
reloaded from MySQL on every request. Lists accept `page` and `limit`; the
server caps `limit` at 50 and returns `meta.page`, `meta.limit`, and
`meta.hasMore`. Customer-facing card lists request 6 rows at a time and
operational tables request 10 rows at a time.

## Public catalog

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Process health |
| GET | `/health/ready` | MySQL readiness |
| GET | `/buildings` | Active Lev Campus locations |
| GET | `/categories?group=eat|shop` | Product categories |
| GET | `/vendors?open=true` | Active vendor search/filter; `open` is optional |
| GET | `/vendors/:slug` | Vendor and delivery-zone detail |
| GET | `/vendors/:slug/products` | Available product catalog |
| GET | `/print-centers` | Active print centers |
| GET | `/media/products/:publicId` | Validated public image |

## Authentication

| Method | Route | Access |
|---|---|---|
| POST | `/auth/customer/register` | Public, campus domain |
| POST | `/auth/customer/login` | Public |
| POST | `/auth/partner/register` | Public, transactional |
| POST | `/auth/partner/login` | Public |
| POST | `/auth/admin/login` | Public, no registration route |
| GET/PATCH/DELETE | `/auth/me` | Authenticated |

## Customer

| Method | Route |
|---|---|
| POST | `/recommendations` |
| GET/POST | `/orders`, `/orders/checkout` |
| GET | `/orders/:publicId` |
| POST | `/orders/:publicId/cancellation-requests` |
| GET/POST | `/print-jobs` |
| GET | `/print-jobs/:publicId` |
| POST | `/print-jobs/:publicId/payment` |
| POST | `/print-jobs/:publicId/cancellation-requests` |
| GET/POST | `/maintenance-tickets` |
| GET | `/maintenance-tickets/:publicId` |
| POST | `/maintenance-tickets/:publicId/comments` |
| GET | `/media/print-files/:publicId` |
| GET | `/media/maintenance/:publicId` |

## Partner

All routes require `vendor_manager`; repository queries are constrained to the
manager's active vendor membership.

```text
GET/PATCH /partner/vendor
GET/POST /partner/products
PUT/DELETE /partner/products/:productPublicId
POST /partner/products/:productPublicId/images
GET/PUT /partner/delivery-zones
GET /partner/orders
GET /partner/orders/:publicId
PATCH /partner/orders/:publicId/status
GET /partner/print-jobs
GET /partner/print-jobs/:publicId
PATCH /partner/print-jobs/:publicId/quote
PATCH /partner/print-jobs/:publicId/status
```

## Administrator

```text
GET /admin/users
PATCH /admin/users/:publicId/status
GET /admin/vendors
PATCH /admin/vendors/:publicId/status
GET/POST /admin/buildings
PUT /admin/buildings/:id
GET /admin/maintenance-tickets
GET/PATCH /admin/maintenance-tickets/:publicId
POST /admin/maintenance-tickets/:publicId/comments
GET /admin/audit
```

Amounts sent to APIs are integer agorot. Client-provided totals, fees, owner
IDs, roles, payment results, status histories, and quote expirations are never
trusted.
