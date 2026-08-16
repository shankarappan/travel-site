import { getPool, PostgresConsentRepository } from '@travel/db';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Consent visibility',
};

export default async function AdminConsentPage() {
  const ledgers = await new PostgresConsentRepository(getPool()).listAll();

  return (
    <main style={{ padding: '2rem', maxWidth: '56rem' }}>
      <h1>Consent ledger</h1>
      <p>Admin visibility into consent events stored in Postgres.</p>
      {ledgers.length === 0 ? (
        <p>No consent events recorded yet.</p>
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
