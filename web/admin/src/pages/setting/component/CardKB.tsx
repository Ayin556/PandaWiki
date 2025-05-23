import { KnowledgeBaseListItem, updateKnowledgeBase } from "@/api"
import Avatar from "@/components/Avatar"
import Card from "@/components/Card"
import { setKbList } from "@/store/slices/config"
import { Box, Button, Divider, IconButton, Stack, TextField } from "@mui/material"
import { Ellipsis, Icon, Message } from "ct-mui"
import { useState } from "react"
import { useDispatch } from "react-redux"

interface CardKBProps {
  kb: KnowledgeBaseListItem
  kbList: KnowledgeBaseListItem[]
}

const CardKB = ({ kb, kbList }: CardKBProps) => {
  const dispatch = useDispatch()
  const [kbName, setKbName] = useState(kb.name)
  const [isEdit, setIsEdit] = useState(false)

  const handleSave = () => {
    if (!kb.id) return
    updateKnowledgeBase({ id: kb.id, name: kbName }).then(() => {
      Message.success('保存成功')
      dispatch(setKbList(kbList.map(item => item.id === kb.id ? { ...item, name: kbName } : item)))
      setIsEdit(false)
    })
  }

  return <Card>
    <Box sx={{ fontWeight: 'bold', m: 2 }}>后台信息</Box>
    <Divider sx={{ my: 2 }} />
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
    }}>
      <Box sx={{ fontWeight: 'bold' }}>知识库名称</Box>
      {kb.name !== kbName && <Button variant="contained" size="small" onClick={handleSave}>保存</Button>}
    </Stack>
    <Box sx={{ m: 2 }}>
      {isEdit ? <TextField
        fullWidth
        value={kbName}
        autoFocus
        onBlur={() => {
          if (kbName === kb?.name) setIsEdit(false)
        }}
        onChange={(e) => setKbName(e.target.value)}
      /> : <Ellipsis
        sx={{
          width: '100%',
          fontSize: 14,
          px: 3,
          fontWeight: 'bold',
          lineHeight: '50px',
          bgcolor: 'background.paper2',
          borderRadius: '10px',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'text.primary',
            cursor: 'text',
          }
        }}
        onClick={() => setIsEdit(true)}
      >{kbName}</Ellipsis>}
    </Box>
    <Divider sx={{ my: 2 }} />
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
      '.MuiButton-startIcon': {
        mr: 1,
      }
    }}>
      <Box sx={{ fontWeight: 'bold' }}>成员与权限</Box>
      <Button size="small" startIcon={<Icon type='icon-tianjiachengyuan' />}>
        添加成员
      </Button>
    </Stack>
    <Box sx={{
      m: 2,
      borderRadius: '10px',
      border: '1px solid',
      borderColor: 'divider',
    }}>
      {new Array(10).fill(1).map((it, idx) => <Stack
        key={idx}
        direction={'row'}
        alignItems={'center'}
        justifyContent={'space-between'}
        sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ maxWidth: 'calc(100% - 322px)' }}>
          <Avatar src={''} sx={{ width: 16 }} />
          <Ellipsis sx={{ fontSize: 14, fontFamily: 'GBold', fontWeight: 'bold' }}>的减fjasdllfsdjflaskjfdldskjfksadljflasdjkfalsk肥沙拉卡</Ellipsis>
        </Stack>
        <Stack direction={'row'} alignItems={'center'} gap={2} flexShrink={0}>
          <Button size='small' variant="outlined" sx={{ px: 1, height: 24 }}>查看分析</Button>
          <Button size='small' variant="outlined" sx={{ px: 1, height: 24, color: 'text.disabled', borderColor: 'text.disabled' }}>管理文档</Button>
          <Button size='small' variant="outlined" sx={{ px: 1, height: 24, color: 'text.disabled', borderColor: 'text.disabled' }}>修改设置</Button>
          <IconButton size="small" sx={{ color: 'text.disabled', ':hover': { color: 'error.main' } }}>
            <Icon type='icon-icon_tool_close' />
          </IconButton>
        </Stack>
      </Stack>)}
    </Box>
  </Card>
}

export default CardKB