import { AppDetail } from "@/api";
import { Box, Stack } from "@mui/material";
import { Ellipsis } from "ct-mui";

const ChatHeader = ({ first, detail, pc = false }: { first: boolean, detail: AppDetail, pc?: boolean }) => {
  if (!first || !detail) return null

  return <Box id={pc ? 'pc-chat-header' : 'h5-chat-header'}>
    <Stack direction={first ? 'column' : 'row'} alignItems={'center'} gap={first ? 1.5 : 1} sx={{ transition: 'all 0.5s' }}>
      <Ellipsis sx={{
        textAlign: first ? 'center' : 'left',
        fontSize: first ? 20 : 16,
        fontWeight: 'bold',
        mb: first ? 1 : 0,
        background: 'linear-gradient(90deg, #0063FF 0%, #3F00FF 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>{detail.settings.welcome_str}</Ellipsis>
    </Stack>
  </Box>
}

export default ChatHeader