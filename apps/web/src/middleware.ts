import { createLogger, createRequestId } from '@travel/observability';
import { NextResponse, type NextRequest } from 'next/server';

const logger = createLogger({ service: 'web-middleware' });

export function middleware(request: NextRequest) {
  const correlationId = createRequestId(request.headers.get('x-correlation-id'));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-correlation-id', correlationId);

  logger.debug('request.start', {
    correlationId,
    path: request.nextUrl.pathname,
    method: request.method,
  });

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('x-correlation-id', correlationId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
