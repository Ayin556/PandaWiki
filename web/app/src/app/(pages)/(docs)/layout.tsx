import DocHeaderBgi from '@/assets/images/doc-header-bg.png';
import Header from '@/components/header';
import { StyledContainer, StyledHeaderBgi } from '@/components/StyledHTML';
import { lightTheme } from '@/theme';
import { ThemeProvider } from 'ct-mui';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <ThemeProvider theme={lightTheme}>
    <StyledHeaderBgi bgi={DocHeaderBgi.src} />
    <Header bgi={DocHeaderBgi.src} />
    <StyledContainer>
      {children}
    </StyledContainer>
  </ThemeProvider>;
};

export default Layout;
