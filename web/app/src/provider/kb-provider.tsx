"use client";

import { KBDetail } from '@/assets/type';
import { createContext, useContext } from 'react';

export const KBDetailContext = createContext<{
  kbDetail?: KBDetail
  kb_id?: string
}>({
  kbDetail: undefined,
  kb_id: undefined,
})

export const useKBDetail = () => useContext(KBDetailContext);

export default function KBProvider({
  children,
  kbDetail,
  kb_id,
}: {
  children: React.ReactNode
  kbDetail?: KBDetail
  kb_id?: string
}) {
  return <KBDetailContext.Provider value={{ kbDetail, kb_id }}>{children}</KBDetailContext.Provider>
}
