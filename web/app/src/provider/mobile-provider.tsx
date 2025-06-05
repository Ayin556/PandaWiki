"use client";

import { createContext, useContext } from 'react';

export const MobileContext = createContext<{
  mobile?: boolean
}>({
  mobile: false,
})

export const useMobile = () => useContext(MobileContext);

export default function MobileProvider({
  children,
  mobile,
}: {
  children: React.ReactNode
  mobile?: boolean
}) {
  return <MobileContext.Provider value={{ mobile }}>{children}</MobileContext.Provider>
}
