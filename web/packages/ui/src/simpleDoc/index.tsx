'use client';

import React from 'react';
import { styled, Grid } from '@mui/material';
import {
  StyledTopicInner,
  StyledTopicContainer,
  StyledTopicBox,
  StyledTopicTitle,
  StyledEllipsis,
} from '../component/styledCommon';
import IconWenjian from '@panda-wiki/icons/IconWenjian';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';

interface SimpleDocProps {
  mobile?: boolean;
  title?: string;
  bgColor?: string;
  titleColor?: string;
  items?: {
    id: string;
    name: string;
  }[];
  baseUrl?: string;
}

const StyledSimpleDocItem = styled('a')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3.5, 2.5),
  backgroundColor: theme.palette.background.paper,
  ...theme.applyStyles('dark', {
    backgroundColor: '#242425',
  }),
  borderRadius: '8px',
  boxShadow: '0px 5px 20px 0px rgba(33,34,45,0.05)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  color: theme.palette.text.primary,
  '&:hover': {
    transform: 'translateY(-5px)',
    color: theme.palette.primary.main,
    boxShadow: '0px 10px 20px 0px rgba(0,0,5px,0.15)',
  },
}));

const StyledSimpleDocItemTitle = styled('h3')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontSize: 20,
  fontWeight: 700,
  width: '100%',
}));

const SimpleDoc: React.FC<SimpleDocProps> = React.memo(
  ({
    title = '简易文档',
    items = [],
    mobile,
    baseUrl = '',
    bgColor,
    titleColor,
  }) => {
    const size =
      typeof mobile === 'boolean' ? (mobile ? 12 : 4) : { xs: 12, md: 4 };
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
                  <StyledSimpleDocItem
                    href={`${baseUrl}/node/${item.id}`}
                    target='_blank'
                  >
                    <StyledSimpleDocItemTitle>
                      <IconWenjian sx={{ fontSize: 16, flexShrink: 0 }} />
                      <StyledEllipsis sx={{ flex: 1 }}>
                        {item.name}
                      </StyledEllipsis>
                      <ArrowForwardIosRoundedIcon
                        sx={{ fontSize: 14, color: 'primary.main' }}
                      />
                    </StyledSimpleDocItemTitle>
                  </StyledSimpleDocItem>
                </Grid>
              ))}
            </Grid>
          </StyledTopicBox>
        </StyledTopicInner>
      </StyledTopicContainer>
    );
  },
);

export default React.memo(SimpleDoc);
