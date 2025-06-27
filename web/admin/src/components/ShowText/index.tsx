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

const ShowText = ({ text, copyable = true, showIcon = true, icon = 'icon-fuzhi', onClick }: ShowTextProps) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1} sx={{
    width: '100%',
    fontSize: 14,
    px: 2,
    lineHeight: '52px',
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
    copyText(text)
    onClick?.()
  } : onClick}>
    <Ellipsis sx={{ width: '100%' }}>
      {text}
    </Ellipsis>
    {showIcon && <Icon type={icon} sx={{ fontSize: 16, color: 'text.disabled' }} />}
  </Stack>
}

export default ShowText