'use client';
import notFound from '@/assets/images/404.png';
import { lightTheme } from '@/theme';
import { Box, Button, Stack } from '@mui/material';
import { ThemeProvider } from 'ct-mui';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <ThemeProvider theme={lightTheme}>
      <Box
        sx={{
          pt: 28,
          height: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Stack
          sx={{
            width: 1200,
            overflow: 'auto',
            pb: 6,
            mx: 'auto',
          }}
          justifyContent='center'
          alignItems='center'
        >
          <Image src={notFound.src} alt='404' width={200} height={200} />
          <Stack gap={3} alignItems='center'>
            <Box>
              页面未找到
            </Box>
            <Button variant='contained' component={Link} href='/' size='large'>
              返回首页
            </Button>
          </Stack>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
