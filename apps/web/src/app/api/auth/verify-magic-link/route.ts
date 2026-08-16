import { signIn } from '../../../../server/identity/auth';
import { buildAppUrl } from '../../../../server/identity/urls';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return Response.redirect(buildAppUrl('/sign-in', request.url, { error: 'missing_token' }));
  }

  try {
    await signIn('magic-link', {
      token,
      redirectTo: '/account',
    });
  } catch (error) {
    // Auth.js throws a NEXT_REDIRECT on success; rethrow redirects.
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    return Response.redirect(buildAppUrl('/sign-in', request.url, { error: 'invalid_token' }));
  }

  return Response.redirect(buildAppUrl('/account', request.url));
}
