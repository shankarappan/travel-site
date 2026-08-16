import { signIn } from '../../../../server/identity/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return Response.redirect(new URL('/sign-in?error=missing_token', request.url));
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
    return Response.redirect(new URL('/sign-in?error=invalid_token', request.url));
  }

  return Response.redirect(new URL('/account', request.url));
}
