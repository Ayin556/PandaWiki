'use client';

import React from 'react';
import { styled, Grid, alpha, Stack, Box } from '@mui/material';
import { StyledTopicBox, StyledTopicTitle } from '../component/styledCommon';
import { useFadeInText, useCardAnimation } from '../hooks/useGsapAnimation';

interface ImgTextProps {
  mobile?: boolean;
  title?: string;
  direction?: 'row' | 'row-reverse';
  item: {
    name: string;
    url: string;
    desc: string;
  };
}
const StyledImgTextItem = styled(Stack)(({ theme }) => ({}));

export const StyledImgTextItemImg = styled('img')(({ theme }) => ({
  maxWidth: 350,
  maxHeight: 350,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  flex: '0 0 auto',
  borderRadius: '10px',
}));

const StyledImgTextItemTitle = styled('h3')(({ theme }) => ({
  fontSize: 20,
  fontWeight: 700,
  color: theme.palette.text.primary,
}));

const StyledImgTextItemSummary = styled('div')(({ theme }) => ({
  width: '50%',
  fontSize: 16,
  fontWeight: 400,
  color: alpha(theme.palette.text.primary, 0.5),
}));

const ImgText: React.FC<ImgTextProps> = React.memo(
  ({ title, mobile, item, direction = 'row' }) => {
    const size =
      typeof mobile === 'boolean'
        ? mobile
          ? 12
          : { xs: 12, md: 6 }
        : { xs: 12, md: 6 };

    const titleRef = useFadeInText(0.2, 0.1);
    const cardRef = useCardAnimation(0.2, 0.1);

    return (
      <StyledTopicBox>
        <StyledTopicTitle ref={titleRef}>{title}</StyledTopicTitle>
        <StyledImgTextItem
          ref={cardRef as React.Ref<HTMLDivElement>}
          gap={mobile ? 4 : { xs: 4, sm: 6, md: 38 }}
          direction={
            mobile
              ? 'column-reverse'
              : {
                  xs: 'column-reverse',
                  md: direction,
                }
          }
          alignItems='center'
          justifyContent='center'
          sx={{ width: '100%' }}
        >
          <Box sx={{ width: '100%' }}>
            <StyledImgTextItemImg src={item.url} alt={item.name} />
          </Box>
          <Stack gap={1} sx={{ width: '100%' }}>
            <StyledImgTextItemTitle>{item.name}</StyledImgTextItemTitle>
            <StyledImgTextItemSummary>{item.desc}</StyledImgTextItemSummary>
          </Stack>
        </StyledImgTextItem>
      </StyledTopicBox>
    );
  },
);

export default ImgText;
