import { getNodeList, ITreeItem, NodeListFilterData } from "@/api"
import { convertToTree } from "@/constant/drag"
import { useAppSelector } from "@/store"
import { Box, Stack } from "@mui/material"
import { Ellipsis, Icon } from "ct-mui"
import { UseTiptapEditorReturn } from "ct-tiptap-editor"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

const EditorFolder = ({ editorRef, content, save }: { editorRef: UseTiptapEditorReturn, content: string, save: (auto?: boolean) => void }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { kb_id } = useAppSelector(state => state.config)
  const [data, setData] = useState<ITreeItem[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const getData = useCallback(() => {
    const params: NodeListFilterData = { kb_id }
    getNodeList(params).then(res => {
      const v = convertToTree(res || [])
      setData(v)
      // 获取所有文件夹的 ID
      const getAllFolderIds = (items: ITreeItem[]): string[] => {
        return items.reduce((acc: string[], item) => {
          if (item.type === 1) {
            acc.push(item.id)
            if (item.children && item.children.length > 0) {
              acc.push(...getAllFolderIds(item.children))
            }
          }
          return acc
        }, [])
      }
      // 设置所有文件夹为展开状态
      setExpandedFolders(new Set(getAllFolderIds(v)))
    })
  }, [kb_id])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const renderTree = (items: ITreeItem[]) => {
    const sortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sortedItems.map(item => (
      <Stack gap={1.5} key={item.id} ml={item.level * 2.5} sx={{ position: 'relative' }}>
        <Stack direction={'row'} alignItems={'center'} gap={1} sx={{
          cursor: 'pointer',
          fontWeight: item.type === 1 ? 'bold' : 'normal',
          color: id === item.id ? 'primary.main' : 'text.primary',
          '&:hover': {
            color: item.type === 2 ? 'primary.main' : 'text.primary',
          }
        }}
          onClick={async () => {
            if (item.type === 1) {
              toggleFolder(item.id)
            } else {
              if (editorRef) {
                const html = editorRef.editor.getHTML() || ''
                if (html !== content) {
                  await save(true)
                }
              }
              navigate(`/doc/editor/${item.id}`)
            }
          }}
        >
          {item.type === 1 && (
            <Box sx={{ position: 'absolute', left: -18, top: 2 }}>
              <Icon
                type="icon-xiajiantou"
                sx={{
                  fontSize: 16,
                  color: 'text.disabled',
                  flexShrink: 0,
                  transform: expandedFolders.has(item.id) ? 'none' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </Box>
          )}
          {item.emoji ? <Box sx={{ fontSize: 13, flexShrink: 0 }}>{item.emoji}</Box>
            : <Icon type={item.type === 1 ? 'icon-wenjianjia' : 'icon-wenjian'} sx={{ color: '#2f80f7', flexShrink: 0 }} />}
          <Ellipsis>{item.name}</Ellipsis>
        </Stack>
        {item.children && item.children.length > 0 && expandedFolders.has(item.id) && (
          <Stack gap={1.5}>
            {renderTree(item.children)}
          </Stack>
        )}
      </Stack>
    ));
  };

  useEffect(() => {
    if (kb_id) getData();
  }, [getData, kb_id]);

  return <Stack sx={{
    borderRadius: '6px',
    bgcolor: 'background.paper',
  }}>
    <Box sx={{
      p: 2,
      px: 3,
      fontWeight: 'bold',
      borderBottom: '2px solid',
      borderColor: 'divider',
    }}>目录</Box>
    <Stack gap={1.5} sx={{
      py: 2,
      px: 3,
      fontSize: 14,
      maxHeight: 'calc(100vh - 178px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      {renderTree(data)}
    </Stack>
  </Stack>
}

export default EditorFolder