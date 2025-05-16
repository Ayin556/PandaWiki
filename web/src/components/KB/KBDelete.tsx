import { Modal } from "@cx/ui"
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ErrorIcon from '@mui/icons-material/Error'
import { Box, Stack, useTheme } from "@mui/material"

interface KBDeleteProps {
  open: boolean
  onClose: () => void
  onOk: () => void
  name: string
}

const KBDelete = ({ open, onClose, onOk, name }: KBDeleteProps) => {
  const theme = useTheme()

  return <Modal
    open={open}
    onCancel={() => {
      onClose()
    }}
    onOk={onOk}
    okButtonProps={{ sx: { bgcolor: 'error.main' } }}
    title={<Stack direction='row' alignItems='center' gap={1}>
      <ErrorIcon sx={{ color: 'warning.main' }} />
      确定要删除该知识库吗？
    </Stack>}
  >
    <Stack direction='row' gap={2} sx={{
      borderBottom: '1px solid',
      borderColor: theme.palette.divider,
      py: 1,
    }}>
      <ArrowForwardIosIcon sx={{ fontSize: 12, mt: '4px', ml: 1 }} />
      <Box>{name}</Box>
    </Stack>
  </Modal>
}


export default KBDelete