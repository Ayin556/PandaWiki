"use client";

import { useTheme, useMediaQuery } from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), {
    defaultMatches: mobile,
  });
  return <MobileContext.Provider value={{ mobile: isMobile }}>{children}</MobileContext.Provider>
}
