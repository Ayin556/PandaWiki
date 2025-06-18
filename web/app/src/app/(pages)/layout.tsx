import { Box } from '@mui/material';
import React from 'react';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <Box sx={{
    bgcolor: 'background.paper',
  }}>
    {children}
  </Box>
};

export default Layout;
