import { ChatConversationItem } from "@/api"
import { Box, Stack } from "@mui/material"
import MarkDown from "../MarkDown"

interface ChatConversationProps {
  pc?: boolean
  conversation: ChatConversationItem[]
}

const ChatConversation = ({ conversation }: ChatConversationProps) => {
  return conversation.map((item, index) => {
    if (item.role === 'user') {
      return <Stack direction={'row'} justifyContent={'flex-end'} gap={1} key={`user-${index}`}>
        <Box key={index} sx={{
          maxWidth: '80%',
          bgcolor: 'rgba(50,72,242,0.1)',
          borderRadius: '10px',
          px: 2,
          py: 1,
          mt: '59px',
          fontSize: '14px',
          color: 'text.primary',
        }}>{item.content}</Box>
      </Stack>
    }
    return <Box sx={{
      fontSize: '14px',
    }}>
      <MarkDown
        content={item.content}
      />
    </Box>
  })
}

export default ChatConversation