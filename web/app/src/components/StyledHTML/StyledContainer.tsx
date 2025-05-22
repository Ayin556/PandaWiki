'use client';
import { styled } from "@mui/material";

const StyledContainer = styled('div')(({ theme }) => ({
  margin: '0 auto',
  width: '100%',
  maxWidth: theme.breakpoints.values.lg,
}));

export default StyledContainer;