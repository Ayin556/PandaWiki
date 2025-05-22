"use client"

import logo from '@/assets/images/logo.png';
import { Box, Stack, TextField } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { KeyboardEvent, useState } from 'react';
import { StyledAppBar, StyledContainer, StyledHeaderBgi } from "../StyledHTML";
import { IconSearch } from '../icons';

const Header = ({ bgi }: { bgi?: string }) => {
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
    <Box sx={{ height: '68px', overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0 }}>
      <StyledHeaderBgi bgi={bgi} sx={{ backgroundSize: 'cover', height: '68px' }} />
    </Box>
    <StyledContainer sx={{
      zIndex: 1,
    }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Box sx={{ py: '20px', cursor: 'pointer' }} >
          <Link href={'/'}>
            <Image src={logo} alt='logo' height={24} />
          </Link>
        </Box>
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
                  sx={{ cursor: 'pointer', color: 'text.auxiliary' }}
                />
              }}
            />
          )}
          {/* <Button variant='text' sx={{ minWidth: 'auto', p: 0 }}>按钮</Button>
          <Button variant='text' sx={{ minWidth: 'auto', p: 0 }}>按钮</Button> */}
        </Stack>
      </Stack>
    </StyledContainer>
  </StyledAppBar>;
};

export default Header;