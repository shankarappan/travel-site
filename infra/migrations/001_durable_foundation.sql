-- Durable platform foundation: identity, consent, trips, commerce, conversations

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  primary_email TEXT UNIQUE,
  roles TEXT[] NOT NULL DEFAULT ARRAY['customer']::TEXT[],
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_primary_email ON users (primary_email);

CREATE TABLE auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  email TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

CREATE INDEX idx_auth_identities_user ON auth_identities (user_id);
CREATE INDEX idx_auth_identities_verified_email
  ON auth_identities (email)
  WHERE email_verified = true AND email IS NOT NULL;

CREATE TABLE magic_link_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_magic_link_tokens_email ON magic_link_tokens (email);

-- Append-only consent history (never update granted in place)
CREATE TABLE consent_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  channel TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  source TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  evidence TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  withdrawn_at TIMESTAMPTZ,
  CONSTRAINT consent_events_purpose_chk CHECK (
    purpose IN (
      'transactional_email',
      'marketing_email',
      'marketing_whatsapp',
      'marketing_telegram',
      'marketing_sms'
    )
  )
);

CREATE INDEX idx_consent_events_user_recorded
  ON consent_events (user_id, recorded_at);

CREATE TABLE consent_unsubscribe_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT trips_status_chk CHECK (status IN ('active', 'archived', 'cancelled'))
);

CREATE INDEX idx_trips_owner_updated ON trips (owner_id, updated_at DESC);

CREATE TABLE trip_travellers (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);

CREATE INDEX idx_trip_travellers_trip ON trip_travellers (trip_id);

CREATE TABLE trip_days (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INT NOT NULL,
  UNIQUE (trip_id, sort_order)
);

CREATE INDEX idx_trip_days_trip ON trip_days (trip_id, sort_order);

CREATE TABLE itinerary_items (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES trip_days (id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  ref_slug TEXT,
  sort_order INT NOT NULL
);

CREATE INDEX idx_itinerary_items_day ON itinerary_items (day_id, sort_order);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  quote_id TEXT,
  payment_id TEXT,
  provider_booking_id TEXT,
  idempotency_key TEXT NOT NULL,
  reconciliation_state TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_orders_user ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders (status);

CREATE TABLE order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  total_minor INT NOT NULL,
  currency CHAR(3) NOT NULL,
  cancellation_terms TEXT NOT NULL
);

CREATE INDEX idx_order_lines_order ON order_lines (order_id);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  amount_minor INT NOT NULL,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL,
  provider_ref TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_payments_order ON payments (order_id);

CREATE TABLE order_status_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_events_order ON order_status_events (order_id, created_at);

CREATE TABLE webhook_events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  provider_ref TEXT,
  status TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE booking_attempts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_booking_id TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_attempts_order ON booking_attempts (order_id);

CREATE TABLE refunds (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
  amount_minor INT NOT NULL,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL,
  reason_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refunds_payment ON refunds (payment_id);

CREATE TABLE email_intents (
  id TEXT PRIMARY KEY,
  template TEXT NOT NULL,
  version TEXT NOT NULL,
  to_address TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  order_id TEXT REFERENCES orders (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_intents_order ON email_intents (order_id);

-- Channel-agnostic conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_conversations_user ON conversations (user_id, updated_at DESC);

CREATE TABLE conversation_channels (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  external_id TEXT NOT NULL,
  linked_user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (channel, external_id)
);

CREATE INDEX idx_conversation_channels_conversation
  ON conversation_channels (conversation_id);

CREATE TABLE conversation_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  direction TEXT,
  body TEXT NOT NULL,
  tool_name TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_conversation_messages_conversation
  ON conversation_messages (conversation_id, created_at);

CREATE TABLE conversation_tool_actions (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  result_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_link_codes (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
