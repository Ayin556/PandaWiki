import { createDoc, DocDetail } from "@/api"
import DocAddByCustomText from "@/pages/document/component/DocAddByCustomText"
import DocDelete from "@/pages/document/component/DocDelete"
import { useAppSelector } from "@/store"
import { Icon, MenuSelect, Message } from "@cx/ui"
import { Box, Button, IconButton, Stack } from "@mui/material"
import { useState } from "react"

interface EditorHeaderProps {
  detail: DocDetail | null
  onSave?: () => void
  refresh?: () => void
}

const EditorHeader = ({ detail, onSave, refresh }: EditorHeaderProps) => {
  const { kb_id } = useAppSelector(state => state.config)

  const [renameOpen, setRenameOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)

  if (!detail) return null

  return <>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{
      width: 880,
      margin: 'auto',
    }}>
      <Box sx={{ fontSize: 18, fontWeight: 'bold' }}>{detail?.meta.title}</Box>
      <Stack direction={'row'} gap={2}>
        <MenuSelect list={[
          {
            key: 'copy',
            label: '复制',
            onClick: () => {
              if (kb_id) {
                createDoc({ title: detail.meta.title + ' [副本]', content: detail.content, kb_id: kb_id, source: 3 }).then((res) => {
                  Message.success('复制成功')
                  window.open(`/doc/editor/${res.ids[0]}`, '_blank')
                })
              }
            }
          },
          {
            key: 'rename',
            label: '重命名',
            onClick: () => {
              setRenameOpen(true)
            }
          },
          {
            key: 'delete',
            label: '删除',
            onClick: () => {
              setDelOpen(true)
            }
          }
        ]} context={<IconButton size="small"><Icon type='icon-gengduo' /></IconButton>} />
        <Button size="small" variant="contained" onClick={onSave}>保存</Button>
      </Stack>
    </Stack>
    <DocAddByCustomText open={renameOpen} onClose={() => {
      setRenameOpen(false)
    }} data={detail} refresh={refresh} />
    <DocDelete open={delOpen} onClose={() => {
      setDelOpen(false)
    }} data={detail} refresh={() => {
      setTimeout(() => {
        window.close();
      }, 1500)
    }} />
  </>
}

export default EditorHeader