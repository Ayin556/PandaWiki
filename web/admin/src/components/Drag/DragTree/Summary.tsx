import { createNodeSummary, ITreeItem } from "@/api"
import Card from "@/components/Card"
import { CheckCircle } from "@mui/icons-material"
import { Stack } from "@mui/material"
import { Ellipsis, Icon, Modal } from "ct-mui"
import { useEffect, useState } from "react"

interface SummaryProps {
  kb_id: string
  data: ITreeItem
  open: boolean
  refresh?: () => void
  onClose: () => void
}

const Summary = ({ open, data, kb_id, refresh, onClose }: SummaryProps) => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [summary, setSummary] = useState('')

  const handleOk = () => {
    setLoading(true)
    createNodeSummary({ kb_id, id: data.id }).then((res) => {
      setSummary(res.summary)
      setSuccess(true)
      refresh?.()
    }).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    if (open) {
      setSummary(data.summary || '')
      setSuccess(false)
    }
  }, [open])

  return <Modal
    open={open}
    onCancel={onClose}
    title={success ? <Stack direction='row' alignItems='center' gap={1}>
      <CheckCircle sx={{ color: 'success.main' }} />
      摘要生成成功
    </Stack> : data.summary ? '文档摘要' : '确认为以下文档生成摘要？'}
    onOk={handleOk}
    okText={data.summary ? '重新生成' : '生成'}
    okButtonProps={{ loading }}
  >
    {!data.summary && !summary && <Stack direction='row' alignItems='center' gap={0.5}>
      <Icon type='icon-wenjian' />
      <Ellipsis sx={{ fontSize: 14 }}>{data.name}</Ellipsis>
    </Stack>}
    {summary && <Card sx={{ p: 2, bgcolor: 'background.paper2', fontSize: 14 }}>
      {summary}
    </Card>}
  </Modal>
}

export default Summary