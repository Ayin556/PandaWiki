import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { KBDetail, NodeListItem } from './assets/type';
import { convertToTree, findFirstType2Node } from './utils/drag';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  try {
    const kb_id = request.headers.get('x-kb-id') || process.env.DEV_KB_ID || ''
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/v1/app/web/info`, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-kb-id': kb_id,
      },
    });
    const result = await res.json()
    const kbDetail = result.data as KBDetail | undefined

    if (url.pathname === '/') {
      if (kbDetail?.settings?.default_display_mode === 2) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/v1/node/list`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-kb-id': kb_id,
          },
        });
        const result = await res.json()
        const nodeList = result.data as NodeListItem[]
        const id = findFirstType2Node(convertToTree(nodeList || []))
        if (id) {
          return NextResponse.redirect(new URL(`/node/${id}`, request.url))
        }
      } else {
        return NextResponse.redirect(new URL('/welcome', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.log(error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
}