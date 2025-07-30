import React from 'react';
import { Box, Button, Popover } from '@mui/material';

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
  return (
    <Popover
      open={open && !!anchorPosition}
      anchorReference='anchorPosition'
      anchorPosition={
        anchorPosition
          ? { top: anchorPosition.y, left: anchorPosition.x }
          : undefined
      }
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      disableRestoreFocus
      sx={{
        pointerEvents: 'none',
        '& .MuiPopover-paper': {
          pointerEvents: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'visible',
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
        }}
      >
        <Button
          size='small'
          variant='contained'
          onClick={onFeedbackClick}
          loading={isCapturingScreenshot}
          sx={{
            fontSize: 12,
            px: 2,
            py: 0.5,
            textTransform: 'none',
          }}
        >
          反馈建议
        </Button>
      </Box>
    </Popover>
  );
};

export default TextSelectionTooltip;
