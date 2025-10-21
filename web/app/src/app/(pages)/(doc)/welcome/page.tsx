import Home from '@/views/home';
import { FooterProvider } from '@/components/footer';
import Header from '@/components/header';
import dotImage from '@/assets/images/dot.png';
import { Stack } from '@mui/material';

const HomePage = () => {
  return (
    <Stack
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${dotImage.src})`,
        backgroundSize: '24px',
        backgroundPosition: 'center',
      }}
      justifyContent='space-between'
    >
      <Header isDocPage={true} isWelcomePage={true} />
      <Stack sx={{ flex: 1 }}>
        <Home />
      </Stack>
      <FooterProvider isDocPage={true} isWelcomePage={true} />
    </Stack>
  );
};

export default HomePage;
