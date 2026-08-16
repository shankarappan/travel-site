# Payment outage

1. Stop new checkout attempts if PSP sandbox/production health is degraded.
2. Verify webhook signature failures vs provider downtime.
3. Queue customer communication via transactional email templates only.
4. After recovery, replay dead-letter webhooks idempotently and reconcile paid-but-unconfirmed orders.
