'use client';

import IconAnswer from '@/assets/images/answer.png';
import { IconArrowUp } from '@/components/icons';
import MarkDown from '@/components/markdown';
import { StyledCard } from "@/components/StyledHTML";
import { Box, Stack, TextField } from "@mui/material";
import Image from "next/image";
import { useState } from 'react';
import ChatLoading from './ChatLoading';
import { AnswerStatus } from './constant';

interface ChatResultProps {
  conversation: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  answer: string;
  loading: boolean;
  thinking: keyof typeof AnswerStatus;
  onSearch: (input: string) => void;
  handleSearchAbort: () => void;
  setThinking: (thinking: keyof typeof AnswerStatus) => void;
}

const ChatResult = ({ conversation, answer, loading, thinking, onSearch, handleSearchAbort, setThinking }: ChatResultProps) => {
  const [input, setInput] = useState('')

  const handleSearch = () => {
    if (input.length > 0) {
      onSearch(input)
      setInput('')
    }
  }

  return <Box sx={{ position: 'relative', width: 'calc((100% - 24px) / 2)' }}>
    <Stack direction='row' gap={1} alignItems='center' sx={{
      fontSize: '20px',
      fontWeight: '700',
      lineHeight: '28px',
      mb: 2,
      height: '28px',
    }}>
      <Box>
        <Image src={IconAnswer.src} alt='智能回答' width={24} height={24} />
      </Box>
      智能回答
    </Stack>
    <StyledCard sx={{
      height: 'calc(100vh - 226px)',
      overflow: 'auto',
    }}>
      <Stack direction='column' gap={2} sx={{
        mb: '132px',
      }}>
        {conversation.map((message, index) => (
          <Box key={index} sx={{
            borderRadius: '10px',
          }}>
            {message.role === 'user' ? <Box sx={{ fontWeight: '700', lineHeight: '24px' }}>
              {message.content}
            </Box> : <Box>
              <MarkDown content={message.content} />
            </Box>}
          </Box>
        ))}
        {answer && <Box>
          <MarkDown content={answer} />
        </Box>}
      </Stack>
      <Box sx={{
        position: 'absolute',
        bottom: 1,
        left: 1,
        right: 24,
        borderRadius: '10px',
        bgcolor: 'background.default',
        p: 3,
        pr: 0,
      }}>
        <Box sx={{
          p: 2,
          bgcolor: 'background.default',
          borderRadius: '10px',
          boxShadow: '0px 4px 8px 4px rgba(54,59,76,0.06)',
        }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            sx={{
              '.MuiInputBase-root': {
                bgcolor: 'background.default',
                p: 0,
                overflow: 'hidden',
                height: '52px !important',
                transition: 'all 0.5s ease-in-out',
              },
              textarea: {
                lineHeight: '26px',
                height: '52px !important',
                borderRadius: 0,
                transition: 'all 0.5s ease-in-out',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              },
              fieldset: {
                border: 'none',
              }
            }}
            size="small"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              const isComposing = e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229;
              if (e.key === 'Enter' && !e.shiftKey && input.length > 0 && !isComposing) {
                e.preventDefault();
                handleSearch()
              }
            }}
            placeholder={'输入问题'}
            autoComplete="off"
            slotProps={{
              input: {
                sx: {
                  gap: 2,
                  alignItems: loading ? 'flex-start' : 'flex-end',
                  mr: loading ? 10 : 4,
                },
                endAdornment: <Box sx={{
                  fontSize: 12,
                  flexShrink: 0,
                  cursor: 'pointer',
                }}>
                  {loading ? <ChatLoading loading={loading} thinking={thinking} onClick={() => {
                    setThinking(4)
                    handleSearchAbort()
                  }} /> : <Box sx={(theme) => ({
                    bgcolor: 'background.default2',
                    borderRadius: '50%',
                    p: 1,
                    ':hover': {
                      bgcolor: `rgba(${theme.palette.primary.mainChannel}, 0.1)`
                    }
                  })} onClick={() => {
                    if (input.length > 0) {
                      handleSearchAbort()
                      setThinking(1)
                      handleSearch()
                    }
                  }}>
                    <IconArrowUp sx={{ fontSize: 12 }} />
                  </Box>}
                </Box>
              }
            }}
          />
        </Box>
      </Box>
    </StyledCard>
  </Box>
}

export default ChatResult;