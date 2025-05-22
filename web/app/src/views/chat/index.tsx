
'use client'

import { ChunkResultItem } from "@/assets/type";
import { isInIframe } from "@/utils";
import SSEClient from "@/utils/fetch";
import { Box, Stack } from "@mui/material";
import { message } from "ct-mui";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatResult from "./ChatResult";
import SearchResult from "./SearchResult";
import { AnswerStatus } from "./constant";

const Chat = ({ id }: { id: string }) => {
  const inIframe = isInIframe()
  const searchParams = useSearchParams();

  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const sseClientRef = useRef<SSEClient<{ type: string, content: string, chunk_result: ChunkResultItem[] }> | null>(null)

  const [conversation, setConversation] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState<keyof typeof AnswerStatus>(4);
  const [nonce, setNonce] = useState('')
  const [chunkResult, setChunkResult] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState('');
  const [answer, setAnswer] = useState('');
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const chatAnswer = useCallback(async (q: string) => {
    setLoading(true);
    setThinking(1);
    setIsUserScrolling(false)

    const reqData = {
      message: q,
      nonce: '',
      conversation_id: '',
      app_type: inIframe ? 2 : 1
    }
    if (conversationId) reqData.conversation_id = conversationId;
    if (nonce) reqData.nonce = nonce;

    if (sseClientRef.current) {
      sseClientRef.current.subscribe(JSON.stringify(reqData), ({ type, content, chunk_result }) => {
        if (type === 'conversation_id') {
          setConversationId(prev => prev + content)
        } else if (type === 'nonce') {
          setNonce(prev => prev + content)
        } else if (type === 'error') {
          setLoading(false)
          setThinking(4)
          setAnswer(prev => {
            if (content) {
              return prev + `\n\n回答出现错误：<error>${content}</error>`
            }
            return prev + '\n\n回答出现错误，请重试'
          })
          if (content) message.error(content)
        } else if (type === 'done') {
          setLoading(false)
          setThinking(4)
        } else if (type === 'data') {
          setAnswer(prev => {
            const newAnswer = prev + content
            if (newAnswer.includes('</think>')) {
              setThinking(3)
              return newAnswer
            }
            if (newAnswer.includes('<think>')) {
              setThinking(2)
              return newAnswer
            }
            setThinking(3)
            return newAnswer
          })
        } else if (type === 'chunk_result') {
          setChunkResult(prev => {
            return [...prev, chunk_result]
          })
        }
      })
    }
  }, [conversationId, nonce, inIframe])

  const onSearch = useCallback((q: string, reset: boolean = false) => {
    if (loading || !q.trim()) return;
    const newConversation = reset ? [] : [...conversation];
    if (answer) {
      newConversation.push({ role: 'assistant', content: answer })
    }
    newConversation.push({ role: 'user', content: q })
    setConversation(newConversation);
    setAnswer('');
    setTimeout(() => {
      chatAnswer(q);
    }, 0);
  }, [loading, answer, conversation, setConversation, setAnswer, chatAnswer])

  const handleSearchAbort = () => {
    sseClientRef.current?.unsubscribe()
    setLoading(false);
    setThinking(4)
  }

  const handleScroll = useCallback(() => {
    if (chatContainerRef?.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      setIsUserScrolling(scrollTop + clientHeight < scrollHeight)
    }
  }, [chatContainerRef])

  useEffect(() => {
    const chatContainer = chatContainerRef?.current
    chatContainer?.addEventListener('scroll', handleScroll)
    return () => {
      chatContainer?.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  useEffect(() => {
    if (!isUserScrolling && chatContainerRef?.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [answer, isUserScrolling])

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      onSearch(search, true);
    }
  }, [searchParams, onSearch]);

  useEffect(() => {
    const origin = location.origin
    sseClientRef.current = new SSEClient({
      url: `${origin}/share/v1/chat/message`,
      headers: {
        'Content-Type': 'application/json',
        'x-kb-id': id || '',
      },
    })
  }, [id])

  return <Box sx={{ pt: 4 }}>
    <Stack alignItems='stretch' direction='row' gap={3}>
      <ChatResult
        conversation={conversation}
        answer={answer}
        loading={loading}
        thinking={thinking}
        setThinking={setThinking}
        onSearch={onSearch}
        handleSearchAbort={handleSearchAbort}
      />
      <SearchResult
        list={chunkResult}
      />
    </Stack>
  </Box>
};

export default Chat;
