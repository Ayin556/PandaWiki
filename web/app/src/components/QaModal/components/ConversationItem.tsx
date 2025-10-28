import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Image from 'next/image';
import dayjs from 'dayjs';
import { ConversationItem as ConversationItemType } from '../types';
import { ChunkResultItem } from '@/assets/type';
import MarkDown from '@/components/markdown';
import MarkDown2 from '@/components/markdown2';
import {
  IconCai,
  IconCaied,
  IconCopy,
  IconZan,
  IconZaned,
} from '@/components/icons';
import { copyText } from '@/utils';
import aiLoading from '@/assets/images/ai-loading.gif';
import { LoadingContent } from './LoadingContent';
import { AnswerStatusType } from '../constants';

interface ConversationItemProps {
  item: ConversationItemType;
  index: number;
  isLast: boolean;
  loading: boolean;
  thinking: AnswerStatusType;
  thinkingContent: string;
  answer: string;
  chunkResult: ChunkResultItem[];
  isChunkResult: boolean;
  isThinking: boolean;
  mobile: boolean;
  themeMode: string;
  isFeedbackEnabled: boolean;
  onScoreChange: (message_id: string, score: number) => void;
  onFeedbackOpen: (item: ConversationItemType) => void;
}

export const ConversationItemComponent: React.FC<ConversationItemProps> = ({
  item,
  index,
  isLast,
  loading,
  thinking,
  thinkingContent,
  answer,
  chunkResult,
  isChunkResult,
  isThinking,
  mobile,
  themeMode,
  isFeedbackEnabled,
  onScoreChange,
  onFeedbackOpen,
}) => {
  const displayChunkResult = isLast ? chunkResult : item.chunk_result;
  const displayThinkingContent = isLast
    ? thinkingContent
    : item.thinking_content;
  const displayAnswer = isLast ? item.a || answer || '' : item.a;

  return (
    <Box>
      <Accordion
        defaultExpanded={true}
        sx={{
          bgcolor:
            themeMode === 'dark' ? 'background.default' : 'background.paper3',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ fontSize: 24 }} />}
          sx={{ userSelect: 'text' }}
        >
          <Box
            sx={{
              fontWeight: '700',
              lineHeight: '24px',
              wordBreak: 'break-all',
            }}
          >
            {item.q}
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 2 }}>
          {/* Chunk结果展示 */}
          {displayChunkResult.length > 0 && (
            <Accordion
              sx={{
                bgcolor: 'transparent',
                border: 'none',
                p: 0,
                pb: 2,
              }}
              defaultExpanded
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 2,
                  '.MuiAccordionSummary-content': {
                    flexGrow: 0,
                  },
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ fontSize: 12, color: 'text.tertiary' }}
                >
                  共找到 {displayChunkResult.length} 个结果
                </Typography>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  pt: 0,
                  pl: 2,
                  borderTop: 'none',
                  borderLeft: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack gap={1}>
                  {displayChunkResult.map((chunk, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          '.hover-primary': {
                            color: 'primary.main',
                          },
                        },
                      }}
                    >
                      <Typography
                        variant='body2'
                        className='hover-primary'
                        sx={{ fontSize: 12, color: 'text.tertiary' }}
                        onClick={() => {
                          window.open(`/node/${chunk.node_id}`, '_blank');
                        }}
                      >
                        {chunk.name}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 加载状态 */}
          {isLast && loading && !isChunkResult && !thinkingContent && (
            <LoadingContent thinking={thinking} />
          )}

          {/* 思考内容展示 */}
          {displayThinkingContent && (
            <Accordion
              sx={{
                bgcolor: 'transparent',
                border: 'none',
                p: 0,
                pb: 2,
                '&:before': {
                  content: '""',
                  height: 0,
                },
              }}
              defaultExpanded
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 2,
                  '.MuiAccordionSummary-content': {
                    flexGrow: 0,
                  },
                }}
              >
                <Stack direction='row' alignItems='center' gap={1}>
                  {isThinking && (
                    <Image
                      src={aiLoading}
                      alt='ai-loading'
                      width={20}
                      height={20}
                    />
                  )}
                  <Typography
                    variant='body2'
                    sx={{ fontSize: 12, color: 'text.tertiary' }}
                  >
                    {isThinking ? '思考中...' : '已思考'}
                  </Typography>
                </Stack>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  pt: 0,
                  pl: 2,
                  borderTop: 'none',
                  borderLeft: '1px solid',
                  borderColor: 'divider',
                  '.markdown-body': {
                    opacity: 0.75,
                    fontSize: 12,
                  },
                }}
              >
                <MarkDown2 content={displayThinkingContent} />
              </AccordionDetails>
            </Accordion>
          )}

          {/* 答案展示 */}
          {item.source === 'history' ? (
            <MarkDown content={item.a} />
          ) : (
            <MarkDown2 content={displayAnswer} />
          )}
        </AccordionDetails>
      </Accordion>

      {/* 反馈区域 */}
      {(!isLast || !loading) && (
        <Stack
          direction={mobile ? 'column' : 'row'}
          alignItems={mobile ? 'flex-start' : 'center'}
          justifyContent='space-between'
          gap={mobile ? 1 : 3}
          sx={{
            fontSize: 12,
            color: 'text.tertiary',
            mt: 2,
          }}
        >
          <Stack direction='row' gap={3} alignItems='center'>
            <span>生成于 {dayjs(item.update_time).fromNow()}</span>

            <IconCopy
              sx={{ cursor: 'pointer' }}
              onClick={() => copyText(item.a)}
            />

            {isFeedbackEnabled && item.source === 'chat' && (
              <>
                {item.score === 1 && <IconZaned sx={{ cursor: 'pointer' }} />}
                {item.score !== 1 && (
                  <IconZan
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (item.score === 0) onScoreChange(item.message_id, 1);
                    }}
                  />
                )}
                {item.score !== -1 && (
                  <IconCai
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (item.score === 0) onFeedbackOpen(item);
                    }}
                  />
                )}
                {item.score === -1 && <IconCaied sx={{ cursor: 'pointer' }} />}
              </>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  );
};
