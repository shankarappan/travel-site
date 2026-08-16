# Feature Prompt Library

Run these prompts one at a time. Before each task, instruct the coding agent to read `03_CURSOR_MASTER_PROMPT.md`, `04_CODEX_DEVELOPMENT_PLAYBOOK.md` and the relevant Technical Blueprint sections.

## Prompt 01 - Repository foundation
Create the initial monorepo for the travel platform. Implement `apps/web`, `apps/admin`, `packages/domain`, `packages/api-contracts`, `packages/providers`, `packages/ai`, and `packages/observability`. Configure TypeScript strict mode, linting, formatting, unit tests, CI, environment validation, structured logging and a basic architecture README. Do not add microservices. Produce an ADR explaining the modular-monolith choice.

## Prompt 02 - Design system and responsive shell
Build the design-token system and application shell. Support 360px mobile, tablet and desktop. Implement accessible navigation, search entry, cards, forms, dialogs, loading/skeleton states, empty/error states and reduced-motion behavior. Use original styling inspired by premium travel products without cloning any competitor. Add Storybook or an equivalent component-review surface if it fits the repo.

## Prompt 03 - Identity and account linking
Implement account registration/login with email/passwordless plus Google and Apple using current official identity flows through the selected auth provider. Map all identities to one internal user ID. Add session handling, logout, account-linking rules, duplicate-email edge cases, role model and tests. Do not place OAuth secrets in client code.

## Prompt 04 - Consent and communication preferences
Implement a consent ledger that distinguishes transactional messages from marketing email and messaging-channel promotions. Store purpose, source, timestamp, policy version, evidence and withdrawal. Build customer preference UI and admin visibility. Include unsubscribe/withdrawal flows and audit events.

## Prompt 05 - Destination content MVP
Implement CMS-backed New Zealand destination pages, article/guide content, hero media, highlights, accommodation/activities placeholders, map hooks and SEO metadata. Build reusable responsive templates rather than hard-coded pages. Add content source fields and accessibility requirements for images.

## Prompt 06 - Saved trips and itinerary builder
Implement trips, trip days and itinerary items. Users can create, rename, share-ready-export later, reorder and delete items. Enforce ownership server-side. Add optimistic UI only where failure recovery is clear.

## Prompt 07 - AI concierge read-only MVP
Implement an AI concierge that can answer from curated destination content and call read-only tools such as `get_destination`, `search_content`, `get_trip`, and `suggest_itinerary`. Use structured tool schemas, prompt versioning, audit metadata, rate limits and conversation persistence. The agent must say when live availability is not connected rather than inventing prices. Add evaluation fixtures.

## Prompt 08 - Accommodation provider abstraction
Create normalized stay-search, offer, quote and booking interfaces plus a provider adapter contract. Implement a fake/sandbox provider first with deterministic fixtures. Include offer expiry, taxes/fees, cancellation terms, room occupancy and currency. Build contract tests before connecting a commercial provider.

## Prompt 09 - Accommodation search UX
Build mobile-first accommodation search and results using the normalized provider interface. Include destination/date/guest inputs, filters, sort, list/map toggle hook, loading/partial-provider error states, price visibility and offer-expiry handling. Preserve URL/shareable search state where sensible.

## Prompt 10 - Quote and checkout foundation
Implement immutable quote snapshots, order state machine and checkout review. Show final price components and cancellation terms before payment. Reprice before commitment. Do not yet claim a supplier booking unless the provider adapter confirms it.

## Prompt 11 - Payments
Integrate the chosen PSP using hosted/tokenized UI. Create exactly one payment intent/session per order attempt according to provider guidance, verify webhooks, handle duplicate events, implement payment states and a reconciliation job. Do not store raw card data. Add sandbox E2E tests.

## Prompt 12 - Booking confirmation and reconciliation
Implement provider booking, idempotency, pending/confirmed/failed states, customer confirmation, support exceptions and reconciliation for payment/provider mismatches. Add operational alerts for paid-but-unconfirmed orders.

## Prompt 13 - Transactional email
Implement versioned transactional templates for account verification, quote/booking confirmation, itinerary, cancellation and refund status. Persist delivery intent/provider ID/status. Keep this subsystem separate from newsletter marketing.

## Prompt 14 - Newsletter and voucher marketing
Integrate the selected marketing platform using consent-qualified segments. Support newsletter subscription, unsubscribe, voucher/promo campaigns and campaign attribution. AI may draft copy but cannot bypass consent rules or publish automatically without configured approval.

## Prompt 15 - Unified conversation hub
Create channel-agnostic conversation/thread/message entities and a tool-action timeline. Define adapters for web chat, WhatsApp, Telegram and voice. Implement identity-linking flow so channel identity never automatically grants access to private booking data.

## Prompt 16 - WhatsApp adapter
Integrate the official WhatsApp Business Platform/Cloud API using webhooks. Normalize inbound/outbound messages, handle template requirements where applicable, add signature/security checks, opt-out handling, rate limits and delivery status. Do not send promotional messages without valid consent.

## Prompt 17 - Telegram adapter
Integrate the official Telegram Bot API. Normalize messages into the conversation hub. Implement secure account linking and do not expose private booking details to an unverified Telegram identity.

## Prompt 18 - ElevenLabs AI receptionist
Connect ElevenLabs/ElevenAgents as the phone/voice channel. Expose a minimal backend tool gateway: identify/verify customer, get booking summary, get itinerary, create support case and transfer to human. For names, email addresses, dates and booking references, require read-back confirmation before high-impact action. Store conversation metadata subject to retention policy.

## Prompt 19 - Voice booking support phase
After core booking is stable, add quote/search support to the voice agent. Any purchase, cancellation, modification or refund must use explicit confirmation plus backend policy. Implement a confidence/escalation policy and human transfer with a concise context summary.

## Prompt 20 - Admin operations console
Build role-based customer search, customer/trip/order/booking/payment timeline, conversation history, support queue, provider errors, webhook retry view, reconciliation exceptions and refund/cancellation controls. Sensitive actions require reason codes and audit logs.

## Prompt 21 - Observability and runbooks
Add end-to-end correlation IDs, traces, key metrics and alerts for search/provider failures, booking/payment failures, webhook backlog and AI tool errors. Create runbooks for provider outage, payment outage, AI outage, data incident and rollback.

## Prompt 22 - PWA hardening
Audit the web product as a production PWA: installability where useful, offline-safe static content, secure caching, responsive images, Core Web Vitals budgets, accessibility and device/browser matrix. Do not cache live prices or booking state in a way that can show stale truth.

## Prompt 23 - React Native app foundation (later)
Create the mobile app only after the responsive web product and APIs are stable. Reuse API contracts/domain types where appropriate, but implement native navigation and mobile interaction patterns. Add secure token storage, deep links, push-notification permissions and app-specific analytics.

## Prompt 24 - Flights discovery (later)
Add a FlightProvider adapter only after commercial API/GDS access is selected and verified. Start with search/quote display before ticketing. Model fare rules, segments, passengers, baggage, expiry and changes explicitly. Do not reuse hotel booking assumptions for air ticketing.

## Prompt 25 - Security and privacy launch audit
Perform a pre-launch review covering authentication, authorization, admin permissions, secrets, webhooks, rate limits, logging, retention, data deletion, consent, cross-border processors, AI prompt injection, payment scope, dependency vulnerabilities and backup/restore. Produce a prioritized remediation report and block launch on critical issues.
