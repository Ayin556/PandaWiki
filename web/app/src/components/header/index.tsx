"use client"

import h5HeaderBgi from '@/assets/images/h5-header-bg.png';
import headerBgi from '@/assets/images/header-bg.jpg';
import Logo from '@/assets/images/logo.png';
import { useKBDetail } from '@/provider/kb-provider';
import { useMobile } from '@/provider/mobile-provider';
import { Box, Button, IconButton, Stack } from "@mui/material";
import Image from 'next/image';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { StyledAppBar, StyledContainer, StyledHeaderBgi } from "../StyledHTML";
import { IconSearch } from '../icons';
import NavBtns from './NavBtns';
import PageChange from './PageChange';

const Header = () => {
  const { mobile } = useMobile()
  const { kbDetail } = useKBDetail()
  const router = useRouter();
  const pathname = usePathname();
  // const [searchValue, setSearchValue] = useState('');

  const isChat = pathname.includes('/chat')
  const modeSwitchVisible = kbDetail?.settings?.mode_switch_visible !== 2

  const bgi = mobile ? h5HeaderBgi.src : headerBgi.src
  const bgiHeight = !mobile ? '573px' : '326px'
  const headerHeight = mobile ? '60px' : '68px'

  // const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter') {
  //     const params = new URLSearchParams();
  //     params.set('search', searchValue);
  //     setSearchValue('');
  //     router.push(`/chat?${params.toString()}`);
  //   }
  // };

  return <>
    {!isChat && <StyledHeaderBgi height={bgiHeight} bgi={bgi} />}
    <StyledAppBar position='fixed' showBorder={isChat && !mobile}>
      {!isChat && <Box sx={{ height: headerHeight, overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0 }}>
        <StyledHeaderBgi
          bgi={bgi}
          height={bgiHeight}
          sx={{
            position: 'absolute',
            backgroundSize: 'cover',
            zIndex: 1,
          }}
        />
      </Box>}
      <StyledContainer sx={{
        zIndex: 1,
        ...(mobile && {
          pl: 3,
          pr: '10px',
        }),
      }}>
        <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ height: headerHeight }}>
          <Link href={'/'}>
            <Stack direction='row' alignItems='center' gap={1.5} sx={{ py: '20px', cursor: 'pointer', '&:hover': { color: 'primary.main' } }} >
              {kbDetail?.settings?.icon ? <img src={kbDetail?.settings?.icon} alt='logo' width={32} height={32} />
                : <Image src={Logo.src} width={32} height={32} alt='logo' />}
              <Box sx={{ fontSize: 18 }}>{kbDetail?.settings?.title}</Box>
            </Stack>
          </Link>
          <Stack direction='row' gap={mobile ? 0 : 3} alignItems="center">
            {pathname.includes('/node/') && (
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
              </IconButton> : null
              // <TextField
              //   size="small"
              //   value={searchValue}
              //   onChange={(e) => setSearchValue(e.target.value)}
              //   onKeyDown={handleKeyDown}
              //   placeholder="搜索..."
              //   sx={{
              //     width: '300px',
              //     bgcolor: 'background.default',
              //     borderRadius: '10px',
              //     overflow: 'hidden',
              //     '& .MuiInputBase-input': {
              //       lineHeight: '24px',
              //       height: '24px',
              //       fontFamily: 'Mono',
              //     },
              //     '& .MuiOutlinedInput-root': {
              //       pr: '18px',
              //       '& fieldset': {
              //         borderRadius: '10px',
              //         borderColor: 'divider',
              //         px: 2,
              //       },
              //     }
              //   }}
              //   InputProps={{
              //     endAdornment: <IconSearch
              //       sx={{ cursor: 'pointer', color: 'text.tertiary' }}
              //     />
              //   }}
              // />
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
            {!mobile && !isChat && modeSwitchVisible && <PageChange />}
          </Stack>
        </Stack>
      </StyledContainer>
    </StyledAppBar>
  </>
};

export default Header;