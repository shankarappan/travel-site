import { checkDatabaseHealth, hasDatabaseUrl } from '@travel/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const correlationId = crypto.randomUUID();
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { ok: false, error: 'DATABASE_URL not configured', correlationId },
      { status: 503, headers: { 'x-correlation-id': correlationId } },
    );
  }
  const result = await checkDatabaseHealth();
  return NextResponse.json(
    { ...result, correlationId },
    {
      status: result.ok ? 200 : 503,
      headers: { 'x-correlation-id': correlationId },
    },
  );
}
