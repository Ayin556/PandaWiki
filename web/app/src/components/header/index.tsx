'use client';

import Logo from '@/assets/images/logo.png';
import { IconSearch } from '@/components/icons';
import { DocWidth } from '@/constant/index';
import { useStore } from '@/provider';
import { Box, Button, IconButton, Stack, TextField } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import NavBtns from './NavBtns';
import { Header as CustomHeader } from '@panda-wiki/ui';
import AiQaModal from '../aiQaModal';
import SearchModal from '../searchModal';
interface HeaderProps {
  isDocPage?: boolean;
  isWelcomePage?: boolean;
}

const Header = ({ isDocPage = false, isWelcomePage = false }: HeaderProps) => {
  const {
    mobile = false,
    kbDetail,
    catalogWidth,
    setQaModalOpen,
    setSearchModalOpen,
  } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const docWidth = useMemo(() => {
    if (isWelcomePage) return 'full';
    return kbDetail?.settings?.theme_and_style?.doc_width || 'full';
  }, [kbDetail, isWelcomePage]);

  const handleSearch = (value?: string, type: 'chat' | 'search' = 'chat') => {
    if (value?.trim()) {
      if (type === 'chat') {
        sessionStorage.setItem('chat_search_query', value.trim());
        setQaModalOpen?.(true);
      } else {
        sessionStorage.setItem('chat_search_query', value.trim());
        setSearchModalOpen?.(true);
      }
    }
  };

  const showSearch = useMemo(() => {
    return pathname !== '/welcome' && !pathname.startsWith('/chat');
  }, [pathname]);

  return (
    <CustomHeader
      isDocPage={isDocPage}
      mobile={mobile}
      docWidth={docWidth}
      catalogWidth={catalogWidth}
      logo={kbDetail?.settings?.icon || Logo.src}
      title={kbDetail?.settings?.title}
      showSearch
      btns={kbDetail?.settings?.btns}
      onSearch={handleSearch}
    >
      <AiQaModal />
      <SearchModal />
    </CustomHeader>
  );
};

export default Header;
