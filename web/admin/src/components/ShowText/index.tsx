import { copyText } from "@/utils"
import { Stack } from "@mui/material"
import { Ellipsis, Icon } from "ct-mui"

interface ShowTextProps {
  text: string[]
  copyable?: boolean
  showIcon?: boolean
  icon?: string
  onClick?: () => void
}

const ShowText = ({ text, copyable = true, showIcon = true, icon = 'icon-fuzhi', onClick }: ShowTextProps) => {
  return <Stack direction={'row'} alignItems={'flex-start'} justifyContent={'space-between'} gap={1} sx={{
    width: '100%',
    fontSize: 12,
    px: 2,
    py: 2,
    lineHeight: '20px',
    fontFamily: 'monospace',
    bgcolor: 'background.paper2',
    borderRadius: '10px',
    cursor: copyable ? 'pointer' : 'default',
    '&:hover': {
      color: 'primary.main',
      svg: {
        color: 'primary.main',
      }
    }
  }} onClick={copyable ? () => {
    copyText(text.join('\n'))
    onClick?.()
  } : onClick}>
    <Stack sx={{ flex: 1, width: 0 }} gap={0.25}>
      {text.map(it => <Ellipsis key={it} sx={{ height: 20 }}>
        {it}
      </Ellipsis>)}
    </Stack>
    {showIcon && <Icon type={icon} sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />}
  </Stack>
}

export default ShowText