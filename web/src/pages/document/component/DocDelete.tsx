import { DocDetail, DocListItem, updateDocAction } from "@/api";
import Card from "@/components/Card";
import { Ellipsis, Message, Modal } from "@cx/ui";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, Stack, useTheme } from "@mui/material";

interface DocDeleteProps {
  open: boolean
  onClose: () => void
  data: DocListItem | DocDetail | null
  refresh?: () => void
}

const DocDelete = ({ open, onClose, data, refresh }: DocDeleteProps) => {
  const theme = useTheme();

  if (!data) return null

  const submit = () => {
    updateDocAction({ doc_ids: [data.id], action: 'delete' }).then(() => {
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
      fontSize: 14, p: 1, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', overflowX: 'hidden',
      bgcolor: 'background.paper2',
    }}>
      <Stack direction='row' gap={2} sx={{
        borderBottom: '1px solid',
        borderColor: theme.palette.divider,
        py: 1,
      }}>
        <ArrowForwardIosIcon sx={{ fontSize: 12, mt: '4px' }} />
        <Box sx={{ width: '100%' }}>
          <Ellipsis sx={{ width: 'calc(100% - 30px)' }}>{'title' in data ? data.title : data.meta.title || '-'}</Ellipsis>
          <Ellipsis sx={{ width: 'calc(100% - 30px)', fontSize: 12, color: 'text.auxiliary' }}>{data.url}</Ellipsis>
        </Box>
      </Stack>
    </Card>
  </Modal>
}

export default DocDelete;