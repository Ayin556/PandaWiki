import { updateNodeAction } from "@/api";
import Card from "@/components/Card";
import { useAppSelector } from "@/store";
import ErrorIcon from '@mui/icons-material/Error';
import { Box, Stack, useTheme } from "@mui/material";
import { Ellipsis, Icon, Message, Modal } from "ct-mui";

interface DocDeleteProps {
  open: boolean
  onClose: () => void
  data: { id: string, name: string, type: number }[]
  refresh?: () => void
}

const DocDelete = ({ open, onClose, data, refresh }: DocDeleteProps) => {
  const theme = useTheme();
  const { kb_id } = useAppSelector(state => state.config)
  if (!data) return null

  const submit = () => {
    updateNodeAction({ ids: data.map(item => item.id), kb_id, action: 'delete' }).then(() => {
      Message.success('删除成功')
      onClose()
      refresh?.();
    })
  }

  return <Modal
    title={<Stack direction='row' alignItems='center' gap={1}>
      <ErrorIcon sx={{ color: 'warning.main' }} />
      确认删除以下内容？
    </Stack>}
    open={open}
    width={600}
    okText='删除'
    okButtonProps={{ sx: { bgcolor: 'error.main' } }}
    onCancel={onClose}
    onOk={submit}
  >
    <Card sx={{
      fontSize: 14, p: 1, px: 2, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', overflowX: 'hidden',
      bgcolor: 'background.paper2',
    }}>
      {data.map(item => <Stack key={item.id} direction='row' alignItems={'center'} gap={2} sx={{
        borderBottom: '1px solid',
        borderColor: theme.palette.divider,
        py: 1,
      }}>
        {item.type === 1 ? <Icon sx={{ flexShrink: 0 }} type={'icon-wenjianjia'} />
          : <Icon sx={{ flexShrink: 0 }} type='icon-wenjian' />}
        <Box sx={{ width: '100%' }}>
          <Ellipsis sx={{ width: 'calc(100% - 40px)' }}>{item.name || '-'}</Ellipsis>
        </Box>
      </Stack>)}
    </Card>
  </Modal>
}

export default DocDelete;