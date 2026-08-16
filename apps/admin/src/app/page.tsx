import type { Role } from '@travel/domain';

const roles: Role[] = ['support', 'operations', 'administrator'];

export default function AdminHomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '42rem' }}>
      <h1>Operations console</h1>
      <p>Role-gated customer, booking and conversation tools will appear here.</p>
      <p>
        <a href="/consent">Consent ledger visibility</a>
      </p>
      <ul>
        {roles.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ul>
    </main>
  );
}
