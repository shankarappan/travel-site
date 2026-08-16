# Deployment rollback

1. Identify bad deploy via CI commit SHA + error tracking.
2. Revert or redeploy previous known-good web/admin build.
3. Confirm migrations are backward-compatible; do not forward-fix if unsafe.
4. Verify login, search, checkout sandbox, and webhook processing after rollback.
