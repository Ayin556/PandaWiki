'use client';

import { useStore } from '@/provider';
import { FooterProvider } from '@/components/footer';
import Header from '@/components/header';
import Catalog from '@/views/node/Catalog';
import { Box, Stack } from '@mui/material';
import CatalogH5 from '@/views/node/CatalogH5';
import { FooterSetting } from '@/assets/type';

const PCLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Stack direction='row'>
      <Catalog />
      <Stack sx={{ flex: 1, height: '100vh', overflow: 'auto' }}>
        <Header />
        <Box
          sx={{
            flex: 1,
            pt: 4,
            position: 'relative',
            zIndex: 1,
            pb: 10,
          }}
        >
          {children}
        </Box>

        <FooterProvider />
      </Stack>
    </Stack>
  );
};

const MobileLayout = ({
  children,
  footerSetting,
}: {
  children?: React.ReactNode;
  footerSetting?: FooterSetting | null;
}) => {
  return (
    <Stack
      sx={{
        position: 'relative',
        height: '100vh',
        overflow: 'auto',
        zIndex: 1,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Header />
        <CatalogH5 />
        {children}
      </Box>
      <Box
        sx={{
          mt: 5,
          bgcolor: 'background.paper2',
          ...(footerSetting?.footer_style === 'complex' && {
            borderTop: '1px solid',
            borderColor: 'divider',
          }),
        }}
      >
        <FooterProvider />
      </Box>
    </Stack>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { mobile, kbDetail } = useStore();
  const footerSetting = kbDetail?.settings?.footer_settings;

  return (
    <>
      {mobile ? (
        <MobileLayout footerSetting={footerSetting}>{children}</MobileLayout>
      ) : (
        <PCLayout>{children}</PCLayout>
      )}
    </>
  );
}
