"use client";

import { KBDetail, NodeListItem } from '@/assets/type';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { createContext, useContext, useEffect, useState } from 'react';

interface StoreContextType {
  kbDetail?: KBDetail
  kb_id?: string
  catalogShow?: boolean
  themeMode?: 'light' | 'dark'
  mobile?: boolean
  nodeList?: NodeListItem[]
  token?: string
  setNodeList?: (list: NodeListItem[]) => void
  setCatalogShow?: (value: boolean) => void
}

export const StoreContext = createContext<StoreContextType>({
  kbDetail: undefined,
  kb_id: undefined,
  catalogShow: undefined,
  themeMode: 'light',
  mobile: false,
  nodeList: undefined,
  token: undefined,
  setNodeList: () => { },
  setCatalogShow: () => { },
})

export const useStore = () => useContext(StoreContext);

export default function StoreProvider({
  children,
  kbDetail,
  kb_id,
  themeMode,
  nodeList: initialNodeList,
  mobile,
  token,
}: StoreContextType & { children: React.ReactNode }) {
  const catalogSettings = kbDetail?.settings?.catalog_settings
  const [nodeList, setNodeList] = useState<NodeListItem[] | undefined>(initialNodeList);
  const [catalogShow, setCatalogShow] = useState(catalogSettings?.catalog_visible !== 2);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('lg'), {
    defaultMatches: mobile,
  });

  useEffect(() => {
    setCatalogShow(catalogSettings?.catalog_visible !== 2);
  }, [kbDetail]);

  return <StoreContext.Provider
    value={{
      kbDetail,
      kb_id,
      themeMode,
      nodeList,
      catalogShow,
      setCatalogShow,
      mobile: isMobile,
      setNodeList,
      token,
    }}
  >{children}</StoreContext.Provider>
}
