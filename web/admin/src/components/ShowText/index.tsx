import { copyText } from "@/utils"
import { Stack } from "@mui/material"
import { Ellipsis, Icon } from "ct-mui"

interface ShowTextProps {
  text: string
  copyable?: boolean
  showIcon?: boolean
  icon?: string
  onClick?: () => void
}

const ShowText = ({ text, copyable = true, showIcon = true, icon = 'icon-a-lianjie5', onClick }: ShowTextProps) => {
  return <Stack direction={'row'} alignItems={'center'} gap={2} sx={{
    width: '100%',
    fontSize: 14,
    px: 3,
    lineHeight: '52px',
    fontFamily: 'monospace',
    bgcolor: 'background.paper2',
    borderRadius: '10px',
    cursor: 'pointer',
    '&:hover': {
      color: 'primary.main',
    }
  }} onClick={copyable ? () => {
    copyText(text)
    onClick?.()
  } : onClick}>
    {showIcon && <Icon type={icon} sx={{ fontSize: 16, color: 'text.auxiliary' }} />}
    <Ellipsis sx={{ width: '100%' }}>
      {text}
    </Ellipsis>
  </Stack>
}

export default ShowText