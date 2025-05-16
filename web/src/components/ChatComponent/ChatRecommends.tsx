import { RecommendDoc } from "@/api"
import { addOpacityToColor } from "@/utils"
import { Box, Stack, useTheme } from "@mui/material"
import { Ellipsis, Icon } from "ct-mui"

interface ChatRecommendsProps {
  docs: RecommendDoc[]
  questions: string[]
  setText: (text: string) => void
  onSearch: (text: string) => void
  pc?: boolean
}

const ChatRecommends = ({ docs = [], questions = [], setText, onSearch, pc = false }: ChatRecommendsProps) => {
  console.log("🐵 ~ ChatRecommends ~ docs:", docs)
  const theme = useTheme()

  return pc ? <Box sx={{ mt: '184px', mb: 5 }}>
    <Stack direction={'row'} justifyContent={'center'} gap={2} flexWrap={'wrap'} sx={{ mt: 2 }}>
      {questions.map(item => (
        <Box key={item} sx={{
          cursor: 'pointer',
          fontSize: '12px',
          lineHeight: '20px',
          height: 32,
          border: `1px solid`,
          borderColor: 'divider',
          borderRadius: '16px',
          py: 0.75,
          px: 1.5,
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1)
          }
        }} onClick={() => {
          setText(item)
          onSearch(item)
        }}>
          {item}
        </Box>
      ))}
    </Stack>

    {docs.length > 0 && <>
      <Box sx={{
        fontSize: '14px',
        lineHeight: '22px',
        mt: 5,
        color: 'text.auxiliary',
      }}>推荐内容</Box>
      <Stack direction={'row'} gap={4} flexWrap={'wrap'} sx={{ mt: 2 }}>
        {docs.map(item => (
          <Box key={item.id} sx={{
            width: 364,
            fontSize: 14,
            lineHeight: '22px',
            p: 3,
            color: 'text.auxiliary',
            bgcolor: 'background.paper',
            borderRadius: '10px',
            border: `1px solid`,
            borderColor: 'divider',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'scale(1.02)',
            }
          }} onClick={() => {
            // window.open(item.url, '_blank')
          }}>
            <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ mb: 1.5 }}>
              <Icon type='icon-bangzhuwendang1' sx={{ fontSize: 18, color: '#2f80f7' }} />
              <Ellipsis sx={{ fontWeight: 'bold', fontSize: 16, color: 'text.primary' }}>{item.title}</Ellipsis>
            </Stack>
            <Box className='three-ellipsis'>{item.summary}</Box>
          </Box>
        ))}
      </Stack>
    </>}
  </Box> : <Box sx={{ mt: '116px', mb: 2 }}>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} sx={{ mt: 2 }}>
      {questions.map(item => (
        <Box key={item} sx={{
          cursor: 'pointer',
          fontSize: '12px',
          lineHeight: '20px',
          height: 32,
          border: `1px solid`,
          borderColor: 'divider',
          borderRadius: '16px',
          py: 0.75,
          px: 1.5,
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1)
          }
        }} onClick={() => {
          setText(item)
          onSearch(item)
        }}>
          {item}
        </Box>
      ))}
    </Stack>
    {docs.length > 0 && <>
      <Box sx={{
        fontSize: '14px',
        lineHeight: '22px',
        mt: 3,
        color: 'text.auxiliary',
      }}>推荐内容</Box>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'} sx={{ mt: 2 }}>
        {docs.slice(0, 10).map(item => (
          <Box key={item.id} sx={{
            width: '100%',
            fontSize: 12,
            lineHeight: '20px',
            color: 'text.primary',
            borderBottom: `1px solid`,
            borderColor: 'divider',
            cursor: 'pointer',
            '&:hover': {
              color: 'primary.main',
            },
            '@media (min-width: 564px)': {
              width: 'calc((100vw - 48px) / 2)',
            }
          }} onClick={() => {
            // window.open(item.url, '_blank')
          }}>
            <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ mb: 1.5 }}>
              <Icon type='icon-bangzhuwendang1' sx={{ fontSize: 18, color: '#2f80f7' }} />
              <Ellipsis>{item.title}</Ellipsis>
            </Stack>
          </Box>
        ))}
      </Stack>
    </>}
  </Box>
}

export default ChatRecommends