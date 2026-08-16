# Provider outage

1. Confirm provider health from admin exceptions + adapter error logs (`correlationId`).
2. Disable affected search/booking feature flag if available; keep destination content online.
3. Communicate status to support; do not invent availability.
4. When restored, re-run reconciliation for `PAID` / `SUPPLIER_PENDING` orders.
