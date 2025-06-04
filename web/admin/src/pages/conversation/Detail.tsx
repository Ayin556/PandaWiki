import { ConversationDetail, getConversationDetail } from "@/api"
import Avatar from "@/components/Avatar"
import Card from "@/components/Card"
import MarkDown from "@/components/MarkDown"
import { addCommasToNumber } from "@/utils"
import { Box, Stack, Tooltip, useTheme } from "@mui/material"
import { Ellipsis, Icon, Modal } from "ct-mui"
import dayjs from "dayjs"
import { useEffect, useState } from "react"


const Detail = ({ id, open, onClose }: { id: string, open: boolean, onClose: () => void }) => {
  const theme = useTheme()
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [stats, setStats] = useState<{
    prompt_tokens?: number,
    completion_tokens?: number,
    total_tokens?: number,
  }>({})

  const getDetail = () => {
    getConversationDetail({ id }).then((res) => {
      setDetail(res)
      if (res.messages.length > 0) {
        const models = new Set(res.messages.map(it => it.model).filter(it => it))
        setModels(Array.from(models))
        const tokens = res.messages.reduce((acc, it) => {
          acc.prompt_tokens += it.prompt_tokens
          acc.completion_tokens += it.completion_tokens
          acc.total_tokens += it.total_tokens
          return acc
        }, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 })
        setStats(tokens)
      }
    })
  }

  useEffect(() => {
    if (open && id) getDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, open])

  return <Modal
    title={<Ellipsis sx={{ fontWeight: 'bold', fontSize: 20, lineHeight: '22px', width: 700 }}>
      {detail?.subject || ''}
    </Ellipsis>}
    width={800}
    open={open}
    onCancel={onClose}
    footer={null}

  >
    {detail ? <Box sx={{ fontSize: 14 }}>
      <Stack direction={'row'} alignItems={'center'} gap={3} sx={{
        fontSize: 14,
        color: 'text.auxiliary',
      }}>
        {detail.created_at && <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Icon type='icon-a-shijian2' />
          {dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}
        </Stack>}
        {detail.remote_ip && <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Icon type='icon-IPdizhijiancha' />
          {detail.remote_ip}
        </Stack>}
        {models.length > 0 && <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Icon type='icon-moxing' />
          使用模型
          <Box>{models.join(', ')}</Box>
        </Stack>}
        {(stats.total_tokens || 0) > 0 && <Tooltip title={<Stack gap={1} sx={{ minWidth: 100, py: 1 }}>
          <Box>输入 Token 使用： {addCommasToNumber(stats.prompt_tokens || 0)}</Box>
          <Box>输出 Token 使用： {addCommasToNumber(stats.completion_tokens || 0)}</Box>
        </Stack>}>
          <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ cursor: 'pointer', lineHeight: 1 }}>
            <Icon type='icon-moxing' />
            Token 统计
            <Box>{addCommasToNumber(stats.total_tokens)}</Box>
            <Icon type='icon-a-wenhao8' />
          </Stack>
        </Tooltip>}
      </Stack>
      {detail.references?.length > 0 && <>
        <Stack direction={'row'} alignItems={'center'} gap={1} sx={{
          fontWeight: 'bold', mt: 2, mb: 1,
          '&::before': {
            content: '""',
            display: 'inline-block',
            width: '4px',
            height: '12px',
            borderRadius: '2px',
            backgroundColor: theme.palette.primary.main,
          }
        }}>内容来源</Stack>
        <Card sx={{ p: 2, bgcolor: 'background.paper2' }}>
          {detail.references.map((item, index) => (
            <Stack direction={'row'} alignItems={'center'} gap={1} key={index}>
              <Avatar
                src={item.favicon}
                sx={{ width: 18, height: 18 }}
                errorIcon={<Icon type='icon-ditu_diqiu' sx={{ fontSize: 18, color: 'text.auxiliary' }} />}
              />
              <Ellipsis>
                <Box
                  component={'a'}
                  href={item.url}
                  target='_blank'
                  sx={{ color: 'text.primary', '&:hover': { color: 'primary.main' } }}
                >{item.title}</Box>
              </Ellipsis>
            </Stack>
          ))}
        </Card>
      </>}
      <Stack direction={'row'} alignItems={'center'} gap={1} sx={{
        fontWeight: 'bold', mt: 2, mb: 1,
        '&::before': {
          content: '""',
          display: 'inline-block',
          width: '4px',
          height: '12px',
          borderRadius: '2px',
          backgroundColor: theme.palette.primary.main,
        }
      }}>分析</Stack>
      <Card sx={{
        borderColor: 'divider',
        border: '1px solid',
        p: 2,
        '.markdown-body': {
          background: 'transparent',
        },
        '#chat-thinking': {
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          fontSize: '12px',
          color: 'text.auxiliary',
          marginBottom: '40px',
          lineHeight: '20px',
          backgroundColor: 'background.paper2',
          padding: '16px',
          cursor: 'pointer',
          borderRadius: '10px',
          div: {
            transition: 'height 0.3s',
            overflow: 'hidden',
            height: '60px',
          }
        }
      }}>
        <Stack gap={2}>
          {detail.messages.map((it, index) => (
            <Stack
              direction={it.role === 'user' ? 'row-reverse' : 'row'}
              key={index}
            >
              <Box sx={{
                borderRadius: '10px',
                px: it.role === 'user' ? 2 : 0,
                py: it.role === 'user' ? 1 : 0,
                bgcolor: it.role === 'user' ? 'rgba(50,72,242,0.1)' : '',
                maxWidth: it.role === 'user' ? '50%' : '100%',
                textAlign: it.role === 'user' ? 'right' : 'left',
              }}>
                <MarkDown content={it.content} />
              </Box>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Box> : <Box></Box>}
  </Modal>
}

export default Detail