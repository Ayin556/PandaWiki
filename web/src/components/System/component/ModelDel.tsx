import { deleteModel, ModelListItem } from "@/api";
import Card from "@/components/Card";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, Stack, useTheme } from "@mui/material";
import { Ellipsis, Message, Modal } from "ct-mui";

interface ModelDelProps {
  open: boolean
  onClose: () => void
  data: ModelListItem
  refresh: () => void
}

const ModelDel = ({ open, onClose, data, refresh }: ModelDelProps) => {
  const theme = useTheme();

  const submit = () => {
    deleteModel({ id: data.id }).then(() => {
      Message.success('删除成功')
      refresh();
      onClose()
    })
  }

  return <Modal
    title={<Stack direction='row' alignItems='center' gap={1}>
      <ErrorIcon sx={{ color: 'warning.main' }} />
      确认删除该模型？
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
      <Stack gap={1} sx={{ px: 2 }}>
        <Stack direction='row' gap={2} key={data.id} sx={{
          borderBottom: '1px solid',
          borderColor: theme.palette.divider,
          py: 1,
        }}>
          <ArrowForwardIosIcon sx={{ fontSize: 12, mt: '4px' }} />
          <Box sx={{ width: '100%' }}>
            <Ellipsis sx={{ width: 'calc(100% - 30px)' }}>{data.model || '-'}</Ellipsis>
            <Ellipsis sx={{ width: 'calc(100% - 30px)', fontSize: 12, color: 'text.auxiliary' }}>{data.base_url}</Ellipsis>
          </Box>
        </Stack>
      </Stack>
    </Card>
  </Modal>
}

export default ModelDel;