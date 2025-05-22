'use client';
import { Box, styled } from "@mui/material";

const StyledCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '10px',
  backgroundColor: theme.palette.background.default,
  padding: '24px',
}));

export default StyledCard;
