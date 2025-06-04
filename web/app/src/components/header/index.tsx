"use client"

import { useKBDetail } from '@/provider/kb-provider';
import { Box, Button, Stack, TextField } from "@mui/material";
import Image from 'next/image';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { KeyboardEvent, useState } from 'react';
import { StyledAppBar, StyledContainer, StyledHeaderBgi } from "../StyledHTML";
import { IconSearch } from '../icons';

const Header = ({ bgi }: { bgi?: string }) => {
  const { kbDetail } = useKBDetail()
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams();
      params.set('search', searchValue);
      setSearchValue('');
      router.push(`/chat?${params.toString()}`);
    }
  };

  return <StyledAppBar position='fixed'>
    <Box sx={{ height: '68px', overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0 }}>
      <StyledHeaderBgi bgi={bgi} sx={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundSize: 'cover', height: '573px' }} />
    </Box>
    <StyledContainer sx={{
      zIndex: 1,
    }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ height: '68px' }}>
        <Link href={'/'}>
          <Stack direction='row' alignItems='center' gap={1.5} sx={{ py: '20px', cursor: 'pointer' }} >
            {kbDetail?.settings?.icon && <Image src={kbDetail?.settings?.icon} alt='logo' width={32} height={32} />}
            <Box sx={{ fontSize: 18 }}>{kbDetail?.settings?.title}</Box>
          </Stack>
        </Link>
        <Stack direction='row' gap={3} alignItems="center">
          {pathname !== '/' && (
            <TextField
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
          {kbDetail?.settings?.btns?.map((item, index) => (
            <Link key={index} href={item.url} target={item.target}>
              <Button
                variant={item.variant}
                startIcon={item.showIcon && item.icon ? <Image src={item.icon} alt='logo' width={24} height={24} /> : null}
                sx={{ textTransform: 'none' }}
              >
                {item.text}
              </Button>
            </Link>
          ))}
        </Stack>
      </Stack>
    </StyledContainer>
  </StyledAppBar>;
};

export default Header;