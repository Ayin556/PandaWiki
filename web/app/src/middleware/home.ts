import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { apiClient } from '../api';
import { convertToTree, findFirstType2Node } from '../utils/drag';

export async function middleware(request: NextRequest, kb_id: string, authToken: string) {
  const url = request.nextUrl.clone()
  console.log('🍐 pathname >>>', url.pathname)

  try {
    const result = await apiClient.serverGetKBInfo(kb_id, authToken);

    if (result.error) {
      return NextResponse.next()
    }
    const kbDetail = result.data;

    const nodeListResult = await apiClient.serverGetNodeList(kb_id, authToken);
    if (nodeListResult.status === 401 && !url.pathname.startsWith('/auth')) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', url.pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (url.pathname === '/') {
      if (kbDetail?.settings?.default_display_mode === 2) {
        if (nodeListResult.data && !nodeListResult.error) {
          const nodeList = nodeListResult.data;
          const id = findFirstType2Node(convertToTree(nodeList || []))
          if (id) {
            return NextResponse.redirect(new URL(`/node/${id}`, request.url))
          }
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