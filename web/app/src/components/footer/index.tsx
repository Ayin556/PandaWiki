import logo from '@/assets/images/logo.png';
import { useKBDetail } from '@/provider/kb-provider';
import { Box, Stack } from "@mui/material";
import Image from "next/image";
import Link from 'next/link';

const Footer = () => {
  const { themeMode } = useKBDetail()
  return <Box sx={{
    position: 'relative',
    fontSize: '12px',
    fontWeight: 'normal',
    color: 'text.tertiary',
    height: 40,
    lineHeight: '40px',
    zIndex: 1,
    bgcolor: themeMode === 'dark' ? 'background.default' : 'background.paper',
  }}>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} gap={0.5}>
      本网站由
      <Link href={'https://pandawiki.docs.baizhi.cloud/'} target='_blank'>
        <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{
          color: 'text.primary',
          cursor: 'pointer',
          '&:hover': {
            color: 'primary.main',
          }
        }}>
          <Image src={logo.src} alt="PandaWiki" width={16} height={16} />
          <Box sx={{ fontWeight: 'bold' }}>PandaWiki</Box>
        </Stack>
      </Link>
      提供技术支持
    </Stack>
  </Box>
}

export default Footer