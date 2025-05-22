import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import type { Metadata, Viewport } from "next";
import localFont from 'next/font/local';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "PandaWiki",
  description: "PandaWiki",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${gilory.variable} ${puhuiti.variable}`}>
        <AppRouterCacheProvider>
          {children}
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
