'use client';

import headerBgi from '@/assets/images/header-bg.png';
import { styled } from '@mui/material';

const StyledHeaderBgi = styled('div')(({ height = '573px', bgi = headerBgi.src }: { height?: string, bgi?: string }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height,
  backgroundImage: `url(${bgi})`,
  backgroundSize: 'cover',
  backgroundPosition: 'top center',
  backgroundRepeat: 'no-repeat',
}));

export default StyledHeaderBgi;