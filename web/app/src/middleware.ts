import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { middleware as clientMiddleware } from './middleware/client';
import { middleware as homeMiddleware } from './middleware/home';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  const kb_id = request.headers.get('x-kb-id') || process.env.DEV_KB_ID || '';
  const authToken = request.cookies.get(`auth_${kb_id}`)?.value || '';

  let sessionId = request.cookies.get('x-pw-session-id')?.value || '';
  let needSetSessionId = false;

  if (!sessionId) {
    sessionId = uuidv4();
    needSetSessionId = true;
  }

  let response: NextResponse;

  if (pathname.startsWith('/client/')) {
    response = await clientMiddleware(request, kb_id, authToken);
  } else {
    response = await homeMiddleware(request, kb_id, authToken);
  }

  // 如果需要设置 sessionId，则在 response 中设置 cookie
  if (needSetSessionId) {
    response.cookies.set('x-pw-session-id', sessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 年
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/chat',
    '/welcome',
    '/auth/login',
    '/node/:path*',
    '/client/:path*'
  ],
} 