# LevGo Verification Checklist

## Automated

- [x] Server ESLint passes.
- [x] Client ESLint passes.
- [x] Vite production build passes.
- [x] Server npm audit reports zero known vulnerabilities.
- [x] Client uses the current React Router release.

## Requires local MySQL

- [ ] Apply schema, seed, and least-privilege grants.
- [ ] Run the three seed accounts.
- [ ] Verify customer, partner, and admin login/guards.
- [ ] Attempt ownership access with a changed public UUID.
- [ ] Run two concurrent stock checkouts and confirm no oversell.
- [ ] Run two concurrent token checkouts and confirm the balance cannot go negative.
- [ ] Verify delivery-zone minimum and fee calculations.
- [ ] Verify unrelated managers cannot read products, orders, or PDFs.
- [ ] Verify unrelated customers cannot read private orders, PDFs, or tickets.
- [ ] Verify blocked users fail on their next protected request.

## Requires external sandboxes

- [ ] Print jobs cannot confirm before an unexpired quote.
- [ ] OpenAI output references only the candidate product set.
- [ ] Missing OpenAI key displays deterministic fallback.

## Files and UI

- [ ] Reject renamed/non-PDF files, files over 15 MB, and extra files.
- [ ] Reject disguised/oversized product and maintenance images.
- [ ] Confirm private media returns `private, no-store`.
- [ ] Confirm print files download rather than render inline.
- [ ] Check public, customer, partner, and admin layouts at 1440 px.
- [ ] Check every workflow at 390 px.
- [ ] Keyboard-test navigation, forms, drawers, and focus indicators.
- [ ] Enable reduced motion and confirm animated feedback is minimized.

The React Router advisory reported by npm on July 27, 2026 concerns framework
RSC action handling. This project is a client-only Vite SPA and does not enable
React Server Components or Router server actions. Navigation targets are
hard-coded application routes. Upgrade as soon as a patched public release is
available.
