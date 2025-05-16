import { Box, Stack } from "@mui/material"

const ChatFooter = ({ bgcolor = '#fff' }: { bgcolor?: string }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={0.5} justifyContent={'center'} sx={{
    position: 'fixed',
    color: 'text.auxiliary',
    bottom: 0, left: 0, width: '100%', height: '24px', bgcolor,
    fontSize: 10,
    letterSpacing: 1,
    zIndex: 3
  }}>
    由 <Box sx={{ color: 'primary.main', fontWeight: 'bold', cursor: 'pointer' }}
      onClick={() => window.open('https://web2gpt.ai', '_blank')}> pandaWiki </Box> 提供技术支持
  </Stack>
}

export default ChatFooter