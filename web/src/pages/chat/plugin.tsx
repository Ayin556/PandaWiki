import { AppDetail, ChatConversationItem, getAppLink } from "@/api"
import ChatLogo from '@/assets/images/chat-logo.png'
import HeaderBGI from '@/assets/images/header.png'
import Avatar from "@/components/Avatar"
import ChatConversation from "@/components/ChatComponent/ChatConversation"
import ChatFooter from "@/components/ChatComponent/ChatFooter"
import ChatHeader from "@/components/ChatComponent/ChatHeader"
import ChatInput from "@/components/ChatComponent/ChatInput"
import ChatLoading from "@/components/ChatComponent/ChatLoading"
import ChatRecommends from "@/components/ChatComponent/ChatRecommends"
import CustomImage from "@/components/CustomImage"
import MarkDown from "@/components/MarkDown"
import { AnswerStatus } from "@/constant/enums"
import SSEClient from "@/utils/fetch"
import { Message } from "@cx/ui"
import { Box, Stack } from "@mui/material"
import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"

const ChatMobile = () => {
  const params = useParams()
  const link = params.link

  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const sseClientRef = useRef<SSEClient<{ type: string, content: string }> | null>(null)

  const [detail, setDetail] = useState<AppDetail | null>(null)
  const [conversation, setConversation] = useState<ChatConversationItem[]>([])

  const [conversationId, setConversationId] = useState('')
  const [nonce, setNonce] = useState('')

  const [first, setFirst] = useState(true)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinking, setThinking] = useState<keyof typeof AnswerStatus>(4)
  const [sseAnswer, setSseAnswer] = useState('')
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  const getAnswer = async (text: string) => {
    setLoading(true)
    setIsUserScrolling(false)
    setThinking(1)

    const reqData = {
      message: text,
      nonce: '',
      conversation_id: conversationId,
    }
    if (nonce) reqData.nonce = nonce
    if (conversationId) reqData.conversation_id = conversationId

    if (sseClientRef.current) {
      sseClientRef.current.subscribe(JSON.stringify(reqData), ({ type, content }) => {
        if (type === 'conversation_id') {
          setConversationId(prev => prev + content)
        } else if (type === 'nonce') {
          setNonce(prev => prev + content)
        } else if (type === 'error') {
          setLoading(false)
          setThinking(4)
          setSseAnswer(prev => {
            if (content) {
              return prev + `\n\n回答出现错误：<error>${content}</error>`
            }
            return prev + '\n\n回答出现错误，请重试'
          })
          if (content) Message.error(content)
        } else if (type === 'done') {
          setThinking(prev => {
            if (prev !== 5) {
              setLoading(false)
              return 4
            }
            return 5
          })
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
        }
      })
    }
  }

  const onSearch = (text: string) => {
    if (!detail || !text.trim() || loading) return
    setFirst(false)

    const newConversation: ChatConversationItem[] = [{ content: text, role: 'user' }]
    if (sseAnswer.length > 0) {
      newConversation.unshift({ content: sseAnswer, role: 'assistant' })
    }

    setConversation([...conversation, ...newConversation])
    setText('')
    setSseAnswer('')
    setConversationId('')

    setTimeout(() => {
      getAnswer(text)
    }, 0)
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
    if (!detail) return
    sseClientRef.current = new SSEClient<{ type: string, content: string }>({
      url: `/share/v1/chat/message?app_id=${detail.id}`,
    })
  }, [detail])

  useEffect(() => {
    if (!link) return;
    getAppLink({ link: link as string }).then(res => {
      setDetail(res)
    })
  }, [link])

  if (!detail) return <></>

  return <Box sx={{ bgcolor: '#FFFFFF' }}>
    <CustomImage
      preview={false}
      src={HeaderBGI}
      alt="header"
      width="100%"
      sx={{ objectFit: 'cover', cursor: 'pointer', position: 'fixed', top: 0, left: 0, height: '50vh' }}
    />
    <Box sx={{
      height: first ? 'auto' : '100vh',
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      overflowY: 'auto',
    }}>
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '52px',
        zIndex: 100,
        borderBottom: `1px solid`,
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      }}>
        <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{
          height: '100%',
          width: '100%',
          px: '20px',
        }}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Avatar
              sx={{ width: 32, height: 32, borderRadius: '50%' }}
              src={detail.settings.icon}
              errorImg={<img src={ChatLogo} style={{ width: '100%', height: '100%' }} />}
            />
            <Box sx={{ fontWeight: 'bold', fontSize: 16, color: 'text.primary' }}>{detail.name}</Box>
          </Stack>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
          </Stack>
        </Stack>
      </Box>
      <ChatFooter />
      {first && <Box sx={{ p: 2, pt: 10, position: 'relative' }}>
        <ChatHeader first={first} detail={detail} pc={false} />
        <ChatRecommends docs={detail.recommend_docs || []} questions={detail.settings.recommend_questions || []} setText={setText} onSearch={onSearch} />
      </Box>}
      <Box ref={chatContainerRef} sx={{
        py: 2,
        overflow: 'hidden',
        overflowY: 'auto',
        position: 'relative',
        maxHeight: 'calc(100vh - 140px)',
      }}>
        <Stack gap={2} sx={{ width: 'calc(100% - 32px)', mx: 2 }}>
          <ChatConversation conversation={conversation} />
          <MarkDown
            loading={loading}
            content={sseAnswer}
          />
          <ChatLoading loading={loading} thinking={thinking} />
        </Stack>
      </Box>
      <ChatInput
        first={first}
        text={text}
        setText={setText}
        thinking={thinking}
        loading={loading}
        onSearch={onSearch}
        handleSearchAbort={handleSearchAbort}
        detail={detail}
        pc={false}
        setThinking={setThinking}
      />
    </Box>
  </Box>
}

export default ChatMobile;