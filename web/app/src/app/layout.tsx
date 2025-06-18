import { KBDetail, NodeListItem } from "@/assets/type";
import KBProvider from "@/provider/kb-provider";
import MobileProvider from "@/provider/mobile-provider";
import NodeListProvider from "@/provider/nodelist-provider";
import { darkTheme, lightTheme } from "@/theme";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider } from "ct-mui";
import parse, { DOMNode, domToReact } from 'html-react-parser';
import type { Metadata, Viewport } from "next";
import localFont from 'next/font/local';
import { headers } from "next/headers";
import Script from 'next/script';
import { cache } from "react";
import { getSelectorsByUserAgent } from "react-device-detect";
import "./globals.css";

const gilory = localFont({
  variable: '--font-gilory',
  src: [
    {
      path: '../assets/fonts/gilroy-bold-700.otf',
      weight: '700',
    },
    {
      path: '../assets/fonts/gilroy-medium-500.otf',
      weight: '400',
    },
    {
      path: '../assets/fonts/gilroy-regular-400.otf',
      weight: '300',
    },
  ],
});

const puhuiti = localFont({
  variable: '--font-puhuiti',
  src: [
    {
      path: '../assets/fonts/AlibabaPuHuiTi-Bold.ttf',
      weight: '700',
    },
    {
      path: '../assets/fonts/AlibabaPuHuiTi-Regular.ttf',
      weight: '400',
    },
  ],
});

const getKBDetailCached = cache(async (kb_id: string) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/v1/app/web/info`, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-kb-id': kb_id,
      },
    });
    const result = await res.json()
    return result.data as KBDetail | undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
})



const getNodeListCached = cache(async (kb_id: string) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/v1/node/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-kb-id': kb_id,
      }
    });
    const result = await res.json()
    return result.data as NodeListItem[]
  } catch (error) {
    console.error('Error fetching document content:', error);
    return undefined
  }
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const kb_id = headersList.get('x-kb-id') || process.env.DEV_KB_ID || ''

  const kbDetail = await getKBDetailCached(kb_id)
  if (!kbDetail) {
    return {
      title: '默认标题',
      description: '默认描述',
      keywords: '默认关键词',
      icons: {
        icon: '/favicon.ico',
      },
    }
  }
  return {
    title: kbDetail?.settings?.title || '默认标题',
    description: kbDetail?.settings?.desc || '默认描述',
    keywords: kbDetail?.settings?.keyword || '默认关键词',
    icons: {
      icon: kbDetail?.settings?.icon || '/favicon.ico',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent');

  const kb_id = headersList.get('x-kb-id') || process.env.DEV_KB_ID || ''
  const nodeList = await getNodeListCached(kb_id)
  const kbDetail = await getKBDetailCached(kb_id)

  const themeMode = kbDetail?.settings?.theme_mode || 'light'

  const { isMobile } = getSelectorsByUserAgent(userAgent || '');
  const options = {
    replace(domNode: DOMNode) {
      if (domNode.type === 'script') {
        if (!domNode.children) return <Script {...domNode.attribs} />;
        return <Script {...domNode.attribs}>{domToReact(domNode.children as any, options)}</Script>
      }
    },
  };

  return (
    <html lang="en">
      <head>
        {kbDetail?.settings?.head_code && (
          <>{parse(kbDetail.settings.head_code, options)}</>
        )}
      </head>
      <body className={`${gilory.variable} ${puhuiti.variable}`}>
        <ThemeProvider theme={themeMode === 'dark' ? darkTheme : lightTheme}>
          <AppRouterCacheProvider>
            <KBProvider kbDetail={kbDetail} kb_id={kb_id} themeMode={themeMode || 'light'}>
              <NodeListProvider nodeList={nodeList} >
                <MobileProvider mobile={isMobile}>
                  {children}
                </MobileProvider>
              </NodeListProvider>
            </KBProvider>
          </AppRouterCacheProvider>
        </ThemeProvider>
        {kbDetail?.settings?.body_code && (
          <>{parse(kbDetail.settings.body_code, options)}</>
        )}
      </body>
    </html >
  );
}
