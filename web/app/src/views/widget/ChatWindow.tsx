'use client';

import MarkDown from '@/components/markdown';
import { useStore } from '@/provider';
import { AnswerStatus } from '@/views/chat/constant';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Skeleton, Stack } from "@mui/material";
import { useEffect, useState } from 'react';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  placeholder: string;
  conversation: { q: string, a: string }[];
  answer: string;
  loading: boolean;
  thinking: keyof typeof AnswerStatus;
  onSearch: (input: string) => void;
  handleSearchAbort: () => void;
  setThinking: (thinking: keyof typeof AnswerStatus) => void;
}

const ChatWindow = ({ conversation, answer, loading, thinking, onSearch, handleSearchAbort, setThinking, placeholder }: ChatWindowProps) => {
  const [input, setInput] = useState('')
  const { themeMode = 'light' } = useStore()

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

  return <Box sx={{
    '&::-webkit-scrollbar': {
      display: 'none'
    },
    mb: 0,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    position: 'relative',
    overflow: 'hidden',
    height: '100%',
  }}>
    <Stack direction='column' gap={2} className='conversation-container' sx={{
      overflow: 'auto',
      height: 'calc(100% - 100px)',
    }}>
      {conversation.map((item, index) => (
        <Accordion key={index} defaultExpanded={true} sx={{
          bgcolor: themeMode === 'dark' ? 'background.default' : 'background.paper',
        }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 24 }} />} sx={{
            userSelect: 'text',
          }}>
            <Box sx={{ fontWeight: '700', lineHeight: '24px' }}>
              {item.q}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <MarkDown content={item.a} />
            {index === conversation.length - 1 && loading && !answer && <>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="70%" />
            </>}
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
    }}>
      <ChatInput
        onSearch={onSearch}
        thinking={thinking}
        loading={loading}
        handleSearchAbort={handleSearchAbort}
        setThinking={setThinking}
        placeholder={placeholder}
      />
    </Box>
  </Box >
}

export default ChatWindow;