'use client';
import { Stack, styled } from "@mui/material";

const StyledAnchor = styled(Stack)(({ theme }) => ({
  gap: '8px',
  fontSize: 14,
  top: 98,
  right: `calc((100vw - ${theme.breakpoints.values.lg}px) / 2 - 8px)`,
  position: 'fixed',
  width: 250,
  minHeight: '500px',
}));

export default StyledAnchor;