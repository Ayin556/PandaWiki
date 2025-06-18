"use client";

import { KBDetail } from '@/assets/type';
import { createContext, useContext } from 'react';

export const KBDetailContext = createContext<{
  kbDetail?: KBDetail
  kb_id?: string
  themeMode?: 'light' | 'dark'
}>({
  kbDetail: undefined,
  kb_id: undefined,
  themeMode: 'light',
})

export const useKBDetail = () => useContext(KBDetailContext);

export default function KBProvider({
  children,
  kbDetail,
  kb_id,
  themeMode,
}: {
  children: React.ReactNode
  kbDetail?: KBDetail
  kb_id?: string
  themeMode?: 'light' | 'dark'
}) {
  return <KBDetailContext.Provider value={{ kbDetail, kb_id, themeMode }}>{children}</KBDetailContext.Provider>
}
