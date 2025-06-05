
import Header from '@/components/header';
import { StyledContainer } from '@/components/StyledHTML';
import { lightTheme } from '@/theme';
import { Box } from '@mui/material';
import { ThemeProvider } from 'ct-mui';
import React from 'react';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return <ThemeProvider theme={lightTheme}>
    <Header />
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <StyledContainer>
        {children}
      </StyledContainer>
    </Box>
  </ThemeProvider>
}

export default Layout
