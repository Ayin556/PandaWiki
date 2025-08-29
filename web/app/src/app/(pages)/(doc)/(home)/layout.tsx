import { FooterProvider } from '@/components/footer';
import Header from '@/components/header';
import Catalog from '@/views/node/Catalog';
import { Stack } from '@mui/material';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Stack direction='row'>
      <Catalog />
      <Stack sx={{ flex: 1, height: '100vh', overflow: 'auto' }}>
        <Header />
        {children}
        <FooterProvider />
      </Stack>
    </Stack>
  );
};

export default Layout;
