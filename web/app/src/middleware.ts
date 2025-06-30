import type { NextRequest } from 'next/server';
import { middleware as authMiddleware } from './middleware/auth';
import { middleware as homeMiddleware } from './middleware/home';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  const kb_id = request.headers.get('x-kb-id') || process.env.DEV_KB_ID || '';
  const authToken = request.cookies.get(`auth_${kb_id}`)?.value || '';

  if (pathname.startsWith('/share/v1/')) {
    return authMiddleware(request, kb_id, authToken);
  }

  return homeMiddleware(request, kb_id, authToken);
}

export const config = {
  matcher: [
    '/',
    '/chat',
    '/welcome',
    '/auth/login',
    '/node/:path*',
    '/share/v1/:path*'
  ],
} 