import { getPrompt } from '@travel/ai';

export default function HomePage() {
  const prompt = getPrompt('concierge.system');

  return (
    <main style={{ padding: '2rem', maxWidth: '40rem' }}>
      <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
        New Zealand first
      </p>
      <h1 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>Aotearoa Trails</h1>
      <p>
        Foundation build in progress. Search, itineraries and AI concierge will land on this shell.
      </p>
      <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>
        Concierge prompt version: {prompt?.version ?? 'n/a'}
      </p>
    </main>
  );
}
