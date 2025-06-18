'use client';


import { IconArrowUp } from '@/components/icons';
import MarkDown from '@/components/markdown';
import { useKBDetail } from '@/provider/kb-provider';
import { useMobile } from '@/provider/mobile-provider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, IconButton, Stack, TextField } from "@mui/material";
import { useEffect, useState } from 'react';
import ChatLoading from './ChatLoading';
import { AnswerStatus } from './constant';

interface ChatResultProps {
  conversation: { q: string, a: string }[];
  answer: string;
  loading: boolean;
  thinking: keyof typeof AnswerStatus;
  onSearch: (input: string) => void;
  handleSearchAbort: () => void;
  setThinking: (thinking: keyof typeof AnswerStatus) => void;
}

const ChatResult = ({ conversation, answer, loading, thinking, onSearch, handleSearchAbort, setThinking }: ChatResultProps) => {
  const [input, setInput] = useState('')
  const { mobile = false } = useMobile()
  const { themeMode } = useKBDetail()

  const handleSearch = () => {
    if (input.length > 0) {
      onSearch(input)
      setInput('')
    }
  }

  const scrollToBottom = () => {
    const container = document.querySelector('.conversation-container')
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [answer, conversation])

  return <Box className='conversation-container' sx={{
    height: mobile ? 'calc(100vh - 313px)' : 'calc(100vh - 266px)',
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      display: 'none'
    },
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }}>
    <Stack direction='column' gap={2} >
      {conversation.map((item, index) => (
        <Accordion key={index} defaultExpanded={index === conversation.length - 1} sx={{
          bgcolor: 'background.default',
        }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ fontWeight: '700', lineHeight: '24px' }}>
              {item.q}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <MarkDown content={item.a} />
            {index === conversation.length - 1 && answer && <MarkDown content={answer} />}
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
    <Box sx={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '10px',
      border: '1px solid',
      borderColor: 'divider',
    }}>
      <Box sx={{
        bgcolor: 'background.default',
        px: 3,
        py: 2,
        borderRadius: '10px',
        ...(mobile && {
          mx: 2,
          mb: 1,
        }),
      }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          sx={{
            '.MuiInputBase-root': {
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
                {loading ? <ChatLoading thinking={thinking} onClick={() => {
                  setThinking(4)
                  handleSearchAbort()
                }} /> : <IconButton size='small' onClick={() => {
                  if (input.length > 0) {
                    handleSearchAbort()
                    setThinking(1)
                    handleSearch()
                  }
                }}>
                  <IconArrowUp sx={{ fontSize: 12 }} />
                </IconButton>}
              </Box>
            }
          }}
        />
      </Box>
    </Box>
  </Box >
}

export default ChatResult;