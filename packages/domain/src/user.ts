export type Role =
  'customer' | 'support' | 'content_editor' | 'operations' | 'finance' | 'administrator';

export interface UserId {
  readonly value: string;
}

export function createUserId(value: string): UserId {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('UserId cannot be empty');
  }
  return { value: trimmed };
}
