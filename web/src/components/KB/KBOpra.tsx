import { deleteKnowledgeBase, KnowledgeBaseListItem } from "@/api"
import { useAppDispatch, useAppSelector } from "@/store"
import { setKbId, setKbList } from "@/store/slices/config"
import { addOpacityToColor } from "@/utils"
import { Icon, MenuSelect, Message } from "@cx/ui"
import { Box, Button, IconButton, Stack, useTheme } from "@mui/material"
import { useState } from "react"
import KBDelete from "./KBDelete"
import KBEdit from "./KBEdit"
import KBTest from "./KBTest"
const KBOpra = ({ data, system = false, refresh }: { data: KnowledgeBaseListItem, system?: boolean, refresh: () => void }) => {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { kbList } = useAppSelector(state => state.config)

  const [delOpen, setDelOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const list = [{
    key: 'delete',
    label: <Box
      key='delete'
      sx={{
        fontSize: 14, px: 2, lineHeight: '40px', height: 40, width: 120,
        borderRadius: '5px',
        textAlign: 'center',
        cursor: 'pointer', ':hover': { bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1) }
      }}
      onClick={() => setDelOpen(true)}>
      删除
    </Box>,
  }]

  if (!system) {
    list.unshift({
      key: 'system',
      label: <Box
        key='system'
        sx={{
          fontSize: 14, px: 2, lineHeight: '40px', height: 40, width: 120,
          borderRadius: '5px',
          textAlign: 'center',
          cursor: 'pointer', ':hover': { bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1) }
        }}
        onClick={() => setEditOpen(true)}>
        设置
      </Box>,
    })
  }

  const handleDelete = () => {
    deleteKnowledgeBase({ id: data.id }).then(() => {
      Message.success('删除成功')
      setDelOpen(false)

      const newList = kbList.filter(item => item.id !== data.id)
      dispatch(setKbList(newList))
      dispatch(setKbId(newList[0].id))
    })
  }

  return <Box onClick={(e) => e.stopPropagation()}>
    <Stack direction={'row'} alignItems={'center'} gap={2}>
      <Button size='small' variant={system ? "outlined" : 'text'} onClick={(e) => {
        e.stopPropagation()
        setTestOpen(true)
      }} >
        问答测试
      </Button>
      {system && <Button size='small' variant="outlined" onClick={(e) => {
        e.stopPropagation()
        setEditOpen(true)
      }} >
        设置
      </Button>}
      <MenuSelect
        type='button'
        list={list}
        context={<IconButton size="small">
          <Icon type='icon-gengduo' />
        </IconButton>}
      />
    </Stack>
    <KBEdit open={editOpen} onClose={() => setEditOpen(false)} data={data} refresh={refresh} />
    <KBTest open={testOpen} onClose={() => setTestOpen(false)} data={data} />
    <KBDelete open={delOpen} onClose={() => setDelOpen(false)} onOk={handleDelete} name={data.name} />
  </Box>
}

export default KBOpra