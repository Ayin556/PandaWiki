import React from 'react';
import { Stack, Typography } from '@mui/material';
import Image from 'next/image';
import aiLoading from '@/assets/images/ai-loading.gif';
import { AnswerStatus, AnswerStatusType } from '../constants';

interface LoadingContentProps {
  thinking: AnswerStatusType;
}

export const LoadingContent: React.FC<LoadingContentProps> = ({ thinking }) => {
  if (thinking === 4) return null;

  return (
    <Stack direction='row' alignItems='center' gap={1} sx={{ pb: 1 }}>
      <Image src={aiLoading} alt='ai-loading' width={20} height={20} />
      <Typography variant='body2' sx={{ fontSize: 12, color: 'text.tertiary' }}>
        {AnswerStatus[thinking]}
      </Typography>
    </Stack>
  );
};
