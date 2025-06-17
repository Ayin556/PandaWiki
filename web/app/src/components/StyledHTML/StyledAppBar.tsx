'use client';
import { AppBar, styled } from "@mui/material";

const StyledAppBar = styled(AppBar)(({ showBorder = false }: { showBorder?: boolean }) => ({
  background: 'transparent',
  color: '#000',
  boxShadow: 'none',
  ...(showBorder && {
    borderBottom: '1px solid',
    borderColor: 'var(--mui-palette-divider)',
  }),
}));

export default StyledAppBar;