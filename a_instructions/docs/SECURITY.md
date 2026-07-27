# LevGo Security and Threat Model

## Trust boundaries

The browser, uploaded files, route identifiers, prices, product availability,
delivery fees, LLM output, and payment return parameters are untrusted. MySQL
data validated inside a transaction and verified PayPal responses are the
authoritative sources.

## Controls

- Passwords are bcrypt hashes with work factor 12.
- JWTs expire after one hour and include issuer and audience validation.
- Protected requests reload the active user and reject blocked/deleted users.
- Authentication, recommendation, and maintenance creation endpoints are
  rate-limited.
- Joi allowlists all input fields; unknown fields are rejected.
- SQL uses placeholders only.
- List limits have a hard maximum.
- JSON request bodies are limited to 200 KB.
- CORS allows one configured client origin.
- Security headers disable MIME sniffing, framing, and referrer leakage.
- Errors return stable safe codes and a request ID, never SQL or stack traces.
- Logs exclude credentials, tokens, document contents, and full prompts.
- React renders user content as text and never uses untrusted HTML.

## Identifier and ownership policy

Public resources use UUIDs or slugs. Every private identifier is loaded and
compared with the authenticated user or vendor membership. A changed URL can
never grant access to another order, print job, document, ticket, or image.

## Payments

The client submits product IDs and quantities, not prices. The order service
locks product rows, recalculates totals, reserves stock, and then creates the
PayPal order. Capture verifies the stored provider order ID, final amount,
currency, state, and owner. Card data is handled only by PayPal.

## Uploads

- Image files: JPEG, PNG, or WebP signatures; 3 MB maximum.
- Print files: PDF signature; 15 MB maximum.
- Upload count is enforced by Multer before service logic.
- Validated file bytes are stored in MySQL `MEDIUMBLOB` columns.
- Original filenames remain metadata and never become filesystem paths.
- Private files are served through an authorization-controlled route.
- The application does not execute or render uploaded PDFs.

Signature checks reduce simple MIME spoofing but are not a malware scanner.
A production deployment should add scanning and isolated print processing.

## LLM safety

Only budget, category, dietary choices, and a minimized catalog projection are
sent to OpenAI. No profile, payment, maintenance, or print-file data is sent.
The server filters candidate products before the request and discards returned
IDs that were not in that set. Recommendations cannot mutate application state.

## Known version-1 limitations

- Campus email suffix validation does not prove mailbox ownership.
- Immediate vendor registration is suitable for the requested academic flow
  but production onboarding should add approval and business verification.
- Rate limits are in-memory and must move to shared storage in a multi-instance
  deployment.
- Refunds and vendor payouts are handled outside LevGo.
- npm currently reports an advisory in React Router's framework RSC action
  handling with no patched public release. LevGo is a Vite client-only SPA: it
  enables neither React Server Components nor Router server actions, and all
  navigation destinations are application-controlled. Upgrade when a patched
  release is published.
