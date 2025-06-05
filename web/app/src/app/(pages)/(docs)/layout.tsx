import Header from '@/components/header';
import { StyledContainer } from '@/components/StyledHTML';
import { lightTheme } from '@/theme';
import { ThemeProvider } from 'ct-mui';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <ThemeProvider theme={lightTheme}>
    <Header />
    <StyledContainer>
      {children}
    </StyledContainer>
  </ThemeProvider>;
};

export default Layout;
