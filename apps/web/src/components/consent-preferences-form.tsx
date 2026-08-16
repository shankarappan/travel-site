'use client';

import { Button, Card } from '@travel/ui';
import { useState } from 'react';
import type { ConsentPurpose } from '@travel/domain';

const OPTIONS: Array<{ purpose: ConsentPurpose; label: string; description: string }> = [
  {
    purpose: 'marketing_email',
    label: 'Marketing email',
    description: 'Newsletters, vouchers and destination campaigns.',
  },
  {
    purpose: 'marketing_whatsapp',
    label: 'WhatsApp promotions',
    description: 'Optional promotional messages on WhatsApp after linking.',
  },
  {
    purpose: 'marketing_telegram',
    label: 'Telegram promotions',
    description: 'Optional promotional messages on Telegram after linking.',
  },
];

export function ConsentPreferencesForm({
  initial,
}: {
  initial: Partial<Record<ConsentPurpose, boolean>>;
}) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/consent/preferences', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferences: values }),
      });
      if (!response.ok) {
        setMessage('Could not save preferences');
        return;
      }
      setMessage('Preferences saved');
    } catch {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold">Transactional email</h2>
        <p className="mt-2 text-sm text-[var(--travel-color-ink-soft)]">
          Booking receipts, security alerts and itinerary updates are always allowed. They are not
          marketing.
        </p>
      </Card>

      {OPTIONS.map((option) => (
        <Card key={option.purpose} as="section">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={Boolean(values[option.purpose])}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [option.purpose]: event.target.checked,
                }))
              }
            />
            <span>
              <span className="block font-semibold text-[var(--travel-color-ink)]">
                {option.label}
              </span>
              <span className="mt-1 block text-sm text-[var(--travel-color-ink-soft)]">
                {option.description}
              </span>
            </span>
          </label>
        </Card>
      ))}

      <Button type="button" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save preferences'}
      </Button>
      {message ? <p className="text-sm text-[var(--travel-color-ink-soft)]">{message}</p> : null}
    </div>
  );
}
