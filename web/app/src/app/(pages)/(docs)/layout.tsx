import { lightTheme } from '@/theme';
import { ThemeProvider } from 'ct-mui';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <ThemeProvider theme={lightTheme}>
    {children}
  </ThemeProvider>;
};

export default Layout;
