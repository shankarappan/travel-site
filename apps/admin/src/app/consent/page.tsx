import { consentLedger } from '@travel/consent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consent visibility',
};

export default function AdminConsentPage() {
  const ledgers = consentLedger.listAll();

  return (
    <main style={{ padding: '2rem', maxWidth: '56rem' }}>
      <h1>Consent ledger</h1>
      <p>
        Admin visibility into consent events. Shared in-memory ledger is process-local until
        Postgres-backed storage lands.
      </p>
      {ledgers.length === 0 ? (
        <p>No consent events recorded in this process yet.</p>
      ) : (
        <ul>
          {ledgers.map((ledger) => (
            <li key={ledger.userId} style={{ marginBottom: '1.5rem' }}>
              <strong>{ledger.userId}</strong>
              <ul>
                {ledger.statuses.map((status) => (
                  <li key={status.purpose}>
                    {status.purpose}: {status.granted ? 'granted' : 'withdrawn'} (policy{' '}
                    {status.policyVersion})
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
