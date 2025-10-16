import Home from '@/views/home';
import { FooterProvider } from '@/components/footer';
import Header from '@/components/header';
import { getShareV1NodeRecommendList } from '@/request/ShareNode';
import dotImage from '@/assets/images/dot.png';
import { Stack } from '@mui/material';

const HomePage = async () => {
  const docs = await getShareV1NodeRecommendList({});
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
      <Home docs={docs} />
      <FooterProvider isDocPage={true} isWelcomePage={true} />
    </Stack>
  );
};

export default HomePage;
