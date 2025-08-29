'use client';

import ErrorComponent from '@/components/error';
import { Stack } from '@mui/material';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Stack justifyContent='center' alignItems='center' sx={{ height: '100%' }}>
      <ErrorComponent error={error} reset={reset} />
    </Stack>
  );
}
