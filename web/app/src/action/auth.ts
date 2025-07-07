'use server';

import { cookies } from 'next/headers';

export async function setAuthCookie(kb_id: string, password: string, days: number = 30) {
  const cookieStore = await cookies();
  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  cookieStore.set(`auth_${kb_id}`, password, {
    expires,
    path: '/',
    httpOnly: false,
    sameSite: 'lax'
  });
}