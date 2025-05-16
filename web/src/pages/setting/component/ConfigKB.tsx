import { updateKnowledgeBase } from "@/api"
import Card from "@/components/Card"
import { useAppDispatch, useAppSelector } from "@/store"
import { setKbList } from "@/store/slices/config"
import { Box, Button, Stack, TextField } from "@mui/material"
import { Ellipsis, Message } from "ct-mui"
import { useEffect, useState } from "react"

const ConfigKB = () => {
  const dispatch = useAppDispatch()
  const { kb_id, kbList } = useAppSelector(state => state.config)
  const kb = kbList.find(item => item.id === kb_id)

  const [edit, setEdit] = useState(false)
  const [name, setName] = useState(kb?.name || '')

  const handleSave = () => {
    if (!kb_id) return
    updateKnowledgeBase({ id: kb_id, name }).then(() => {
      Message.success('保存成功')
      dispatch(setKbList(kbList.map(item => item.id === kb_id ? { ...item, name } : item)))
      setEdit(false)
    })
  }

  useEffect(() => {
    if (!kb_id) return
    const kb = kbList.find(item => item.id === kb_id)
    setName(kb?.name || '')
  }, [kb_id, kbList])

  return <Card sx={{ p: 2 }}>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ height: '32px' }}>
      <Box>基本信息</Box>
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 1 }}>
      <Box sx={{ fontSize: 14, lineHeight: '36px', height: '36px', width: 150 }}>
        知识库名称
      </Box>
      {edit ? <TextField
        sx={{ width: 300 }}
        size="small"
        placeholder="知识库名称"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name === kb?.name) setEdit(false)
        }}
      /> : <Ellipsis sx={{
        width: 300,
        fontSize: 14,
        px: '14px',
        fontWeight: 'bold',
        lineHeight: '36px',
        bgcolor: 'background.paper2',
        borderRadius: '10px',
        cursor: 'pointer'
      }} onClick={() => setEdit(true)}>{name}</Ellipsis>}
      {name !== kb?.name && <Button size="small" variant="outlined" onClick={handleSave}>保存</Button>}
    </Stack>
  </Card >
}

export default ConfigKB