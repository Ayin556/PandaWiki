'use client';

import React from 'react';
import { styled, Grid, Box } from '@mui/material';
import {
  StyledTopicBox,
  StyledTopicTitle,
  StyledEllipsis,
  StyledTopicInner,
  StyledTopicContainer,
} from '../component/styledCommon';
import { IconWenjianjia, IconWenjian } from '@panda-wiki/icons';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

interface DirDocProps {
  mobile?: boolean;
  title?: string;
  bgColor?: string;
  titleColor?: string;
  items?: {
    id: string;
    name: string;
    recommend_nodes: {
      id: string;
      name: string;
    }[];
  }[];
  baseUrl?: string;
}

const StyledDirDocItem = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: theme.spacing(3.5, 2.5),
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0px 5px 20px 0px rgba(33,34,45,0.05)',
  border: `1px solid #ECEEF1`,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0px 10px 20px 0px rgba(0,0,5,0.15)',
  },
  width: '100%',
}));

const StyledDirDocItemTitle = styled('h3')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: '#171c19',
  gap: theme.spacing(1),
  fontSize: 20,
  fontWeight: 700,
  width: '100%',
}));

const StyledDirDocItemFiles = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: '1 0 auto',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  gap: theme.spacing(2),
  fontSize: 14,
  fontWeight: 400,
  height: 169,
  width: '100%',
  lineHeight: 1.5,
}));

const StyledDirDocItemFile = styled('a')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  width: '100%',
  cursor: 'pointer',
  color: '#717572',
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

const StyledDirDocItemMore = styled('a')(({ theme }) => ({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
  color: theme.palette.primary.main,
  fontSize: 14,
  fontWeight: 400,
  cursor: 'pointer',
}));

const DirDoc: React.FC<DirDocProps> = React.memo(
  ({
    title = '目录文档',
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
            <Grid container spacing={3} sx={{ width: '100%' }}>
              {items.map((item, index) => (
                <Grid size={size} key={index}>
                  <StyledDirDocItem>
                    <StyledDirDocItemTitle>
                      <IconWenjianjia sx={{ fontSize: 16, flexShrink: 0 }} />
                      <StyledEllipsis>{item.name}</StyledEllipsis>
                    </StyledDirDocItemTitle>
                    <StyledDirDocItemFiles>
                      {item.recommend_nodes.slice(0, 5).map(it => (
                        <StyledDirDocItemFile
                          href={`${baseUrl}/node/${it.id}`}
                          target='_blank'
                        >
                          <IconWenjian sx={{ fontSize: 14, flexShrink: 0 }} />
                          <StyledEllipsis>{it.name}</StyledEllipsis>
                        </StyledDirDocItemFile>
                      ))}
                    </StyledDirDocItemFiles>
                    <StyledDirDocItemMore
                      href={`${baseUrl}/node/${item.id}`}
                      target='_blank'
                    >
                      查看更多
                      <ArrowForwardRoundedIcon
                        sx={{ fontSize: 16, flexShrink: 0 }}
                      />
                    </StyledDirDocItemMore>
                  </StyledDirDocItem>
                </Grid>
              ))}
            </Grid>
          </StyledTopicBox>
        </StyledTopicInner>
      </StyledTopicContainer>
    );
  },
);

export default React.memo(DirDoc);
