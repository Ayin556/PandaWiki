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
import { useFadeInText, useCardAnimation } from '../hooks/useGsapAnimation';

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
  opacity: 0,
}));

const StyledFaqItemTitle = styled('span')(({ theme }) => ({
  fontSize: 16,
  fontWeight: 600,
}));

// 单个卡片组件，带动画效果
const FaqItem: React.FC<{
  item: any;
  index: number;
  size: any;
}> = React.memo(({ item, index, size }) => {
  const cardRef = useCardAnimation(0.2 + index * 0.1, 0.1);

  return (
    <Grid size={size} key={index}>
      <StyledFaqItem
        ref={cardRef as React.Ref<HTMLAnchorElement>}
        href={item.url}
        target='_blank'
      >
        <HelpIcon sx={{ color: 'primary.main', fontSize: 18 }} />
        <StyledFaqItemTitle>{item.question}</StyledFaqItemTitle>
      </StyledFaqItem>
    </Grid>
  );
});

const Faq: React.FC<FaqProps> = React.memo(
  ({ title = '链接组', items = [], mobile, bgColor, titleColor }) => {
    const size =
      typeof mobile === 'boolean' ? (mobile ? 12 : 6) : { xs: 12, md: 6 };

    // 添加标题淡入动画
    const titleRef = useFadeInText(0.2, 0.1);

    return (
      <StyledTopicContainer>
        <StyledTopicInner sx={{ backgroundColor: bgColor }}>
          <StyledTopicBox>
            <StyledTopicTitle ref={titleRef} sx={{ color: titleColor }}>
              {title}
            </StyledTopicTitle>
            <Grid container spacing={2} sx={{ width: '100%' }}>
              {items.map((item, index) => (
                <FaqItem key={index} item={item} index={index} size={size} />
              ))}
            </Grid>
          </StyledTopicBox>
        </StyledTopicInner>
      </StyledTopicContainer>
    );
  },
);

export default Faq;
