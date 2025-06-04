import { deleteUser, UserInfo } from "@/api";
import Card from "@/components/Card";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box, Stack } from "@mui/material";
import { Ellipsis, Message, Modal } from "ct-mui";

interface MemberDeleteProps {
  open: boolean
  onClose: () => void
  user: UserInfo | null
  refresh: () => void
}

const MemberDelete = ({ open, onClose, user, refresh }: MemberDeleteProps) => {

  const submit = () => {
    if (!user?.id) return
    deleteUser({ user_id: user.id }).then(() => {
      Message.success('删除成功')
      refresh()
      onClose()
    })
  }

  if (!user) return null
  return <Modal
    open={open}
    width={600}
    okText='删除'
    okButtonProps={{ sx: { bgcolor: 'error.main' } }}
    onCancel={onClose}
    onOk={submit}
    title="确定要删除该用户吗？"
  >
    <Card sx={{
      fontSize: 14,
      p: 1,
      bgcolor: 'background.paper2'
    }}>
      <Stack direction='row' gap={2} sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1,
      }}>
        <ArrowForwardIosIcon sx={{ fontSize: 12, mt: '4px' }} />
        <Box sx={{ width: '100%' }}>
          <Ellipsis sx={{ width: 'calc(100% - 30px)' }}>{user.account || '-'}</Ellipsis>
        </Box>
      </Stack>
    </Card>
  </Modal>
}
export default MemberDelete