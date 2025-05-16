import { ChatConversationItem, KnowledgeBaseListItem } from "@/api"
import ChatConversation from "@/components/ChatComponent/ChatConversation"
import ChatInput from "@/components/ChatComponent/ChatInput"
import ChatLoading from "@/components/ChatComponent/ChatLoading"
import MarkDown from "@/components/MarkDown"
import { AnswerStatus } from "@/constant/enums"
import SSEClient from "@/utils/fetch"
import { Message, Modal } from "@cx/ui"
import { Box, Stack } from "@mui/material"
import { useCallback, useEffect, useRef, useState } from "react"

interface TestKBProps {
  open: boolean
  onClose: () => void
  data: KnowledgeBaseListItem
}

const KBTest = ({ open, onClose, data }: TestKBProps) => {
  const token = localStorage.getItem('panda_wiki_token') || ''

  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const sseClientRef = useRef<SSEClient<{ type: string, content: string }> | null>(null)

  const [conversation, setConversation] = useState<ChatConversationItem[]>([])

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinking, setThinking] = useState<keyof typeof AnswerStatus>(4)
  const [sseAnswer, setSseAnswer] = useState('')
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [wait, setWait] = useState(false)

  const getAnswer = async () => {
    setLoading(true)
    setIsUserScrolling(false)
    setThinking(1)
    setWait(false)

    const reqData = {
      kb_id: data.id,
      messages: conversation.slice(-6)
    }

    if (sseClientRef.current) {
      sseClientRef.current.subscribe(JSON.stringify(reqData), ({ type, content }) => {
        if (type === 'error') {
          setLoading(false)
          setThinking(4)
          setSseAnswer(prev => {
            if (content) {
              return prev + `\n\n回答出现错误：<error>${content}</error>`
            }
            return prev + '\n\n回答出现错误，请重试'
          })
          if (content) Message.error(content)
        } else if (type === 'data') {
          setSseAnswer(prev => {
            const newAnswer = prev + content
            if (newAnswer.includes('</think>')) {
              setThinking(3)
              return newAnswer
            }
            if (newAnswer.includes('<think>')) {
              setThinking(2)
              return newAnswer
            }
            return newAnswer
          })
        } else if (type === 'done') {
          setThinking(prev => {
            if (prev !== 5) {
              setLoading(false)
              return 4
            }
            return 5
          })
        }
      })
    }
  }

  const onSearch = (text: string) => {
    if (!text.trim() || loading) return

    const newConversation: ChatConversationItem[] = [{ content: text, role: 'user' }]
    if (sseAnswer.length > 0) {
      newConversation.unshift({ content: sseAnswer, role: 'assistant' })
    }

    setConversation([...conversation, ...newConversation])

    setWait(true)
    setText('')
    setSseAnswer('')
    setIsUserScrolling(false)
  }

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
    if (wait) {
      getAnswer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wait])

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
  }, [sseAnswer, isUserScrolling])

  useEffect(() => {
    if (!data || !token) return
    sseClientRef.current = new SSEClient<{ type: string, content: string }>({
      url: `/api/v1/chat/kb`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }, [data, token])

  return <Modal
    open={open}
    width={800}
    onCancel={() => {
      onClose()
    }}
    title={`知识库「${data.name}」 - 问答测试`}
    footer={null}
  >
    <Box sx={{
      position: 'relative',
      height: 'calc(100vh - 300px)',
    }}>
      <Box ref={chatContainerRef} sx={{
        position: 'relative',
        py: 2,
        px: 2,
        overflow: 'hidden',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 400px)',
      }}>
        <Stack gap={2} sx={{ width: 713, m: 'auto' }}>
          <ChatConversation conversation={conversation} pc={true} />
          <MarkDown
            loading={loading}
            content={sseAnswer}
          />
          <ChatLoading loading={loading} thinking={thinking} />
        </Stack>
      </Box>
      <Box sx={{
        '>div': {
          bottom: 0,
          position: 'absolute !important',
        }
      }}>
        <ChatInput
          first={false}
          text={text}
          setText={setText}
          thinking={thinking}
          loading={loading}
          onSearch={onSearch}
          handleSearchAbort={handleSearchAbort}
          pc={true}
          setThinking={setThinking}
        />
      </Box>
    </Box>
  </Modal>
}

export default KBTest