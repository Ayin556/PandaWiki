"use client"

import docHeaderBgi from '@/assets/images/doc-header-bg.png';
import h5HeaderBgi from '@/assets/images/h5-header-bg.png';
import headerBgi from '@/assets/images/header-bg.png';
import { useKBDetail } from '@/provider/kb-provider';
import { useMobile } from '@/provider/mobile-provider';
import { Box, Button, IconButton, Stack, TextField } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { KeyboardEvent, useState } from 'react';
import { StyledAppBar, StyledContainer, StyledHeaderBgi } from "../StyledHTML";
import { IconSearch } from '../icons';
import NavBtns from './NavBtns';

const Header = () => {
  const { mobile } = useMobile()
  const { kbDetail } = useKBDetail()
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');

  const isDoc = pathname.includes('/node')

  const bgi = isDoc ? docHeaderBgi.src : mobile ? h5HeaderBgi.src : headerBgi.src
  const bgiHeight = (isDoc || !mobile) ? '573px' : '326px'
  const headerHeight = mobile ? '60px' : '68px'

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams();
      params.set('search', searchValue);
      setSearchValue('');
      router.push(`/chat?${params.toString()}`);
    }
  };

  return <>
    <StyledHeaderBgi height={bgiHeight} bgi={bgi} />
    <StyledAppBar position='fixed'>
      <Box sx={{ height: headerHeight, overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0 }}>
        <StyledHeaderBgi
          bgi={bgi}
          height={bgiHeight}
          sx={{
            position: 'absolute',
            backgroundSize: 'cover',
            zIndex: 1,
          }}
        />
      </Box>
      <StyledContainer sx={{
        zIndex: 1,
        ...(mobile && {
          pl: 3,
          pr: '10px',
        }),
      }}>
        <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ height: headerHeight }}>
          <Link href={'/'}>
            <Stack direction='row' alignItems='center' gap={1.5} sx={{ py: '20px', cursor: 'pointer' }} >
              {kbDetail?.settings?.icon && <img src={kbDetail?.settings?.icon} alt='logo' width={32} height={32} />}
              <Box sx={{ fontSize: 18 }}>{kbDetail?.settings?.title}</Box>
            </Stack>
          </Link>
          <Stack direction='row' gap={mobile ? 0 : 3} alignItems="center">
            {pathname !== '/' && pathname !== '/chat' && (
              mobile ? <IconButton
                size='small'
                sx={{ width: 40, height: 40, color: 'text.primary' }}
              >
                <IconSearch
                  sx={{ fontSize: 20 }}
                  onClick={() => {
                    router.push(`/chat`);
                  }}
                />
              </IconButton> : <TextField
                size="small"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索..."
                sx={{
                  width: '300px',
                  bgcolor: 'background.default',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  '& .MuiInputBase-input': {
                    lineHeight: '24px',
                    height: '24px',
                    fontFamily: 'Mono',
                  },
                  '& .MuiOutlinedInput-root': {
                    pr: '18px',
                    '& fieldset': {
                      borderRadius: '10px',
                      borderColor: 'divider',
                      px: 2,
                    },
                  }
                }}
                InputProps={{
                  endAdornment: <IconSearch
                    sx={{ cursor: 'pointer', color: 'text.tertiary' }}
                  />
                }}
              />
            )}
            {!mobile && kbDetail?.settings?.btns?.map((item, index) => (
              <Link key={index} href={item.url} target={item.target}>
                <Button
                  variant={item.variant}
                  startIcon={item.showIcon && item.icon ? <img src={item.icon} alt='logo' width={24} height={24} /> : null}
                  sx={{ textTransform: 'none' }}
                >
                  {item.text}
                </Button>
              </Link>
            ))}
            {mobile && <NavBtns detail={kbDetail} />}
          </Stack>
        </Stack>
      </StyledContainer>
    </StyledAppBar>
  </>
};

export default Header;