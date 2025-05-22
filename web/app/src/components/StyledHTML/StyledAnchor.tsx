'use client';
import { Stack, styled } from "@mui/material";

const StyledAnchor = styled(Stack)(({ theme }) => ({
  top: 98,
  right: `calc((100vw - ${theme.breakpoints.values.lg}px) / 2 - 8px)`,
  position: 'fixed',
  width: '194px',
  minHeight: '500px',
  borderLeft: `1px solid ${theme.palette.divider}`,
  paddingLeft: theme.spacing(3),
  marginLeft: theme.spacing(7),
}));

export default StyledAnchor;