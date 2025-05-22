'use client';

import headerBgi from '@/assets/images/header-bg.png';
import { styled } from '@mui/material';

const StyledHeaderBgi = styled('div')(({ bgi = headerBgi.src }: { bgi?: string }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  width: '100vw',
  height: '573px',
  backgroundImage: `url(${bgi})`,
  backgroundSize: 'contain',
  backgroundPosition: 'top center',
  backgroundRepeat: 'no-repeat',
}));

export default StyledHeaderBgi;