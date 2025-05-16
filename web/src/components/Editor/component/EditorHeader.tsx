import { createDoc, DocDetail } from "@/api"
import DocAddByCustomText from "@/pages/document/component/DocAddByCustomText"
import DocDelete from "@/pages/document/component/DocDelete"
import { useAppSelector } from "@/store"
import { getShortcutKeyText } from "@/utils"
import { Box, Button, IconButton, Stack, Tooltip } from "@mui/material"
import { Editor } from "@tiptap/core"
import { Icon, MenuSelect, Message } from "ct-mui"
import dayjs from "dayjs"
import { useState } from "react"

interface EditorHeaderProps {
  editor: Editor | null
  detail: DocDetail | null
  onSave?: () => void
  refresh?: () => void
}

const EditorHeader = ({ editor, detail, onSave, refresh }: EditorHeaderProps) => {
  const { kb_id } = useAppSelector(state => state.config)

  const [renameOpen, setRenameOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)

  const handleExport = async (type: string) => {
    if (!editor) return
    if (type === 'html') {
      const html = editor.getHTML()
      if (!html) return
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${detail?.meta.title}.html`
      a.click()
      URL.revokeObjectURL(url)
      Message.success('导出成功')
    }
    if (type === 'md') {
      const markdown = editor.storage.markdown.getMarkdown()
      if (!markdown) return
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${detail?.meta.title}.md`
      a.click()
      URL.revokeObjectURL(url)
      Message.success('导出成功')
    }
    // if (type === 'docx') {
    //   editor.chain().focus().export({ format: 'docx' }).run()
    // }
  }

  if (!detail) return null

  return <>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{
      width: 800,
      margin: 'auto',
    }}>
      <Box sx={{ fontSize: 18, fontWeight: 'bold' }}>{detail?.meta.title}</Box>
      <Stack direction={'row'} alignItems={'center'} gap={2}>
        <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ fontSize: 12, color: 'text.auxiliary' }}>
          <Icon type='icon-baocun' />
          {dayjs(detail.updated_at).format('YYYY-MM-DD HH:mm:ss')}
        </Stack>
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
        <MenuSelect list={[
          // {
          //   key: 'pdf',
          //   label: '导出 PDF',
          //   onClick: () => handleExport('pdf')
          // },
          // {
          //   key: 'docx',
          //   label: '导出 Docx',
          //   onClick: () => handleExport('docx')
          // },
          {
            key: 'html',
            label: '导出 HTML',
            onClick: () => handleExport('html')
          },
          {
            key: 'md',
            label: '导出 Markdown',
            onClick: () => handleExport('md')
          }
        ]} context={<Button size="small" variant="outlined"
          startIcon={<Icon type='icon-daochu' />}>导出</Button>} />
        <Tooltip title={<Box>
          {getShortcutKeyText(['ctrl', 's'])}
        </Box>} placement="bottom" arrow>
          <Button size="small" variant="contained" onClick={onSave}
            startIcon={<Icon type='icon-baocun' />}>保存</Button>
        </Tooltip>
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