'use client'

import logo from '@/assets/images/logo.png';
import { Box, Stack } from "@mui/material";
import Image from "next/image";

const Footer = () => {
  return <Box sx={{
    position: 'relative',
    fontSize: '12px',
    fontWeight: 'normal',
    color: '#999',
    height: 40,
    lineHeight: '40px',
    bgcolor: '#fff',
    zIndex: 1,
    cursor: 'pointer',
  }} onClick={() => {
    window.open('https://pandawiki.docs.baizhi.cloud/', '_blank')
  }}>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} gap={0.5}>
      本网站由
      <Image src={logo} alt="PandaWiki" width={16} height={16} />
      <Box sx={{ fontWeight: 'bold', color: '#000' }}>PandaWiki</Box>
      提供技术支持
    </Stack>
  </Box>
}

export default Footer