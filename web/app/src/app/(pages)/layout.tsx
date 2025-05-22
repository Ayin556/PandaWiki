import { lightTheme } from '@/theme';
import { Box } from '@mui/material';
import { ThemeProvider } from 'ct-mui';
import React from 'react';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <ThemeProvider theme={lightTheme}>
    <Box>
      {children}
    </Box>
  </ThemeProvider>;
};

export default Layout;
