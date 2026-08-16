import { checkDatabaseHealth, hasDatabaseUrl } from '@travel/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const correlationId = crypto.randomUUID();
  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      {
        ok: false,
        service: 'web',
        databaseConfigured: false,
        correlationId,
      },
      { status: 503, headers: { 'x-correlation-id': correlationId } },
    );
  }

  const db = await checkDatabaseHealth();
  return NextResponse.json(
    {
      ok: db.ok,
      service: 'web',
      databaseConfigured: true,
      database: db,
      correlationId,
    },
    {
      status: db.ok ? 200 : 503,
      headers: { 'x-correlation-id': correlationId },
    },
  );
}
