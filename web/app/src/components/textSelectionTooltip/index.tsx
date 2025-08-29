import { IconErrorCorrection } from '@/components/icons';
import { alpha, Box, Button, Tooltip } from '@mui/material';
import React from 'react';

interface TextSelectionTooltipProps {
  open: boolean;
  selectedText: string;
  anchorPosition: { x: number; y: number } | null;
  onFeedbackClick: () => void;
  isCapturingScreenshot?: boolean;
  className?: string;
}

export const TextSelectionTooltip: React.FC<TextSelectionTooltipProps> = ({
  open,
  selectedText,
  anchorPosition,
  onFeedbackClick,
  isCapturingScreenshot = false,
  className = 'text-selection-tooltip',
}) => {
  if (!open || !anchorPosition) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: anchorPosition.y,
        left: anchorPosition.x,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none',
        '& > *': {
          pointerEvents: 'auto',
        },
      }}
      className={className}
    >
      <Box
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'visible',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid',
            borderTopColor: 'divider',
          },
        }}
      >
        <Tooltip title='文档纠错'>
          <Button
            size='small'
            variant='text'
            onClick={onFeedbackClick}
            loading={isCapturingScreenshot}
            sx={theme => ({
              fontSize: 12,
              px: 0,
              py: 0.5,
              width: 24,
              height: 24,
              textTransform: 'none',
              minWidth: 'auto',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.disabled, 0.1),
              },
            })}
          >
            {!isCapturingScreenshot && (
              <IconErrorCorrection
                sx={{ fontSize: 16, color: 'text.primary' }}
              />
            )}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default TextSelectionTooltip;
