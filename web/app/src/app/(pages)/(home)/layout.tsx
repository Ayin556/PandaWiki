
import Header from '@/components/header';
import { Box } from '@mui/material';
import React from 'react';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return <>
    <Header />
    <Box sx={{
      position: 'relative',
      zIndex: 1,
      width: '100%',
      margin: '0 auto',
      maxWidth: '1200px',
    }}>
      {children}
    </Box>
  </>
}

export default Layout
