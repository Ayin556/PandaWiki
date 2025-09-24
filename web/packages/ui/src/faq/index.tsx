'use client';

import React from 'react';
import { styled, Grid } from '@mui/material';
import {
  StyledTopicBox,
  StyledTopicTitle,
  StyledTopicInner,
  StyledTopicContainer,
} from '../component/styledCommon';
import HelpIcon from '@mui/icons-material/Help';

interface FaqProps {
  mobile?: boolean;
  title?: string;
  bgColor?: string;
  titleColor?: string;
  items?: {
    question: string;
    url: string;
  }[];
}

const StyledFaqItem = styled('a')(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  // @ts-ignore
  backgroundColor: theme.palette.background.paper3,
  ...theme.applyStyles('dark', {
    backgroundColor: '#242425',
  }),
  borderRadius: '12px',
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3, 2),
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '3px',
    backgroundColor: theme.palette.primary.main,
  },
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    color: theme.palette.primary.main,
  },
}));

const StyledFaqItemTitle = styled('span')(({ theme }) => ({
  fontSize: 16,
  fontWeight: 600,
}));

const Faq: React.FC<FaqProps> = React.memo(
  ({ title = '常见问题', items = [], mobile, bgColor, titleColor }) => {
    const size =
      typeof mobile === 'boolean' ? (mobile ? 12 : 6) : { xs: 12, md: 6 };
    return (
      <StyledTopicContainer>
        <StyledTopicInner sx={{ backgroundColor: bgColor }}>
          <StyledTopicBox>
            <StyledTopicTitle sx={{ color: titleColor }}>
              {title}
            </StyledTopicTitle>
            <Grid container spacing={2} sx={{ width: '100%' }}>
              {items.map((item, index) => (
                <Grid size={size} key={index}>
                  <StyledFaqItem href={item.url} target='_blank'>
                    <HelpIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                    <StyledFaqItemTitle>{item.question}</StyledFaqItemTitle>
                  </StyledFaqItem>
                </Grid>
              ))}
            </Grid>
          </StyledTopicBox>
        </StyledTopicInner>
      </StyledTopicContainer>
    );
  },
);

export default React.memo(Faq);
