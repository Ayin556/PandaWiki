import { deleteKnowledgeBase, getKnowledgeBaseList, KnowledgeBaseListItem } from "@/api"
import { useAppDispatch, useAppSelector } from "@/store"
import { setKbId, setKbList } from "@/store/slices/config"
import custom from '@/themes/custom'
import { Ellipsis, Icon, Message } from "@cx/ui"
import { Box, Button, IconButton, MenuItem, Select, Stack } from "@mui/material"
import { useEffect, useState } from "react"
import KBEdit from "../KB/KBEdit"
import KBDelete from "./KBDelete"


const KBSelect = () => {
  const dispatch = useAppDispatch()
  const local_kb_id = localStorage.getItem('kb_id') || ''
  const { kb_id, kbList } = useAppSelector(state => state.config)

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [opraData, setOpraData] = useState<KnowledgeBaseListItem | null>(null)

  const getKbList = (id?: string) => {
    getKnowledgeBaseList().then(res => {
      dispatch(setKbList(res))
      const kbId = id || local_kb_id || kb_id
      if (res.find(item => item.id === kbId)) {
        dispatch(setKbId(kbId))
      } else {
        dispatch(setKbId(res[0].id))
      }
    })
  }

  useEffect(() => {
    getKbList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>
    {kbList.length > 0 && <Select
      value={kb_id}
      size='small'
      sx={{
        maxWidth: 300,
        pr: 2,
        height: 32,
        fontSize: 14,
        transition: 'all 0.3s',
        '.MuiSelect-select': {
          width: 'calc(100% + 48px)',
        },
        '&:hover': {
          transition: 'all 0.3s',
          '.icon-xiala': {
            display: 'block',
          },
        },
        '&.Mui-focused': {
          transition: 'all 0.3s',
          '.icon-xiala': {
            display: 'block',
          },
        },
      }}
      onChange={(e) => {
        if (e.target.value === kb_id || !e.target.value) return
        dispatch(setKbId(e.target.value as string))
        Message.success('切换成功')
      }}
      IconComponent={({ className, ...rest }) => {
        return <Icon
          type='icon-xiala'
          className={className + ' icon-xiala'}
          sx={{
            position: 'absolute',
            right: 0,
            fontSize: 20,
            flexShrink: 0,
            mr: 1,
            transform: className?.includes('MuiSelect-iconOpen') ? 'rotate(-180deg)' : 'none',
            transition: 'transform 0.3s',
            cursor: 'pointer',
            pointerEvents: 'none',
            display: className?.includes('MuiSelect-iconOpen') ? 'block' : 'none',
          }}
          {...rest}
        />
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            width: 300,
            maxHeight: 292,
          }
        },
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'center',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'center',
        }
      }}
    >
      <Button size='small' sx={{
        height: 40,
        mb: 0.5,
        borderRadius: '5px',
        bgcolor: 'background.paper2',
        '&:hover': {
          bgcolor: custom.selectedMenuItemBgColor,
        }
      }} fullWidth onClick={(event) => {
        event.stopPropagation()
        setCreateOpen(true)
      }}
      >创建新知识库</Button>
      {kbList.map(item => <MenuItem key={item.id} value={item.id} sx={{
        '&:hover .hover-del-space-icon': { display: 'block' }
      }}>
        <Stack direction={'row'} alignItems={'center'} gap={1.5} sx={{ width: '100%' }}>
          <Icon type='icon-zuzhi' sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
          <Ellipsis>{item.name}</Ellipsis>
          <Box sx={{ width: 10 }}></Box>
          <IconButton size='small' className='hover-del-space-icon' sx={{ display: 'none' }}>
            <Icon
              type='icon-shanchu'
              sx={{ fontSize: 14, color: 'text.auxiliary', flexShrink: 0 }}
              onClick={(event) => {
                event.stopPropagation()
                setOpraData(item)
                setDeleteOpen(true)
              }}
            />
          </IconButton>
        </Stack>
      </MenuItem>)}
    </Select>}
    <KBEdit open={createOpen} onClose={() => setCreateOpen(false)} refresh={(id) => getKbList(id)} />
    <KBDelete open={deleteOpen} onClose={() => setDeleteOpen(false)} name={opraData?.name || ''} onOk={() => {
      deleteKnowledgeBase({ id: opraData?.id || '' }).then(() => {
        Message.success('删除成功')
        setDeleteOpen(false)
        getKbList()
      })
    }} />
  </>
}

export default KBSelect