import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

interface SuggestionListProps {
  hotSearch: string[];
  fuzzySuggestions: string[];
  showFuzzySuggestions: boolean;
  input: string;
  onSuggestionClick: (text: string) => void;
  highlightMatch: (text: string, query: string) => React.ReactNode;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({
  hotSearch,
  fuzzySuggestions,
  showFuzzySuggestions,
  input,
  onSuggestionClick,
  highlightMatch,
}) => {
  // 模糊搜索建议
  if (showFuzzySuggestions && fuzzySuggestions.length > 0) {
    return (
      <Stack
        sx={{
          mt: 1,
          position: 'relative',
          zIndex: 1000,
        }}
        gap={0.5}
      >
        {fuzzySuggestions.map((suggestion, index) => (
          <Box
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            sx={{
              py: 1,
              px: 2,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              bgcolor: 'transparent',
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              display: 'flex',
              alignItems: 'center',
              width: 'auto',
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            {highlightMatch(suggestion, input)}
          </Box>
        ))}
      </Stack>
    );
  }

  // 热门搜索建议
  if (!showFuzzySuggestions && hotSearch.length > 0) {
    return (
      <Stack sx={{ mt: 2 }} gap={1}>
        {hotSearch.map((suggestion, index) => (
          <Box
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            sx={{
              py: '6px',
              px: 2,
              mb: 1,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              bgcolor: '#F8F9FA',
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              },
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              width: 'auto',
            }}
          >
            <Typography variant='body2' sx={{ fontSize: 14, flex: 1 }}>
              {suggestion} →
            </Typography>
          </Box>
        ))}
      </Stack>
    );
  }

  return null;
};
