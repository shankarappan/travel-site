import { consentLedger } from '@travel/consent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operations console',
};

export default function AdminHomePage() {
  const ledgers = consentLedger.listAll();

  return (
    <main style={{ padding: '2rem', maxWidth: '64rem', display: 'grid', gap: '1.5rem' }}>
      <h1>Operations console</h1>
      <p>
        Role model: support / operations / finance / administrator. Customer search, trip/order
        timelines, conversation history, webhook retries and refund controls plug into the same
        modular-monolith APIs used by web.
      </p>

      <section>
        <h2>Quick links</h2>
        <ul>
          <li>
            <a href="/consent">Consent ledger visibility</a>
          </li>
          <li>Orders / payments / bookings — consume web commerce APIs in this process later</li>
          <li>Conversation hub — WhatsApp/Telegram/voice webhooks normalize into shared threads</li>
          <li>Reconciliation — alert on paid-but-unconfirmed via commerce reconcile job</li>
        </ul>
      </section>

      <section>
        <h2>Consent snapshot (this process)</h2>
        {ledgers.length === 0 ? (
          <p>No consent events in this admin process yet.</p>
        ) : (
          <ul>
            {ledgers.map((ledger) => (
              <li key={ledger.userId}>
                {ledger.userId}:{' '}
                {ledger.statuses.map((s) => `${s.purpose}=${s.granted}`).join(', ')}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Sensitive actions policy</h2>
        <p>
          Refunds, exports and impersonation require reason codes + audit logs. Step-up auth is
          required before production enablement.
        </p>
      </section>
    </main>
  );
}
