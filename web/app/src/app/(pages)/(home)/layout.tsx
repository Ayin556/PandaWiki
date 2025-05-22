import Header from '@/components/header';
import { StyledContainer, StyledHeaderBgi } from '@/components/StyledHTML';
import { lightTheme } from '@/theme';
import { Box } from '@mui/material';
import { ThemeProvider } from 'ct-mui';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <ThemeProvider theme={lightTheme}>
    <StyledHeaderBgi />
    <Header />
    <Box sx={{ mt: 8, position: 'relative', zIndex: 1 }}>
      <StyledContainer>
        {children}
      </StyledContainer>
    </Box>
  </ThemeProvider>;
};

export default Layout;
