import { getNodeList, ITreeItem, NodeListFilterData } from "@/api"
import { convertToTree } from "@/constant/drag"
import { useAppSelector } from "@/store"
import { Box, Stack } from "@mui/material"
import { Ellipsis, Icon } from "ct-mui"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

const EditorFolder = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { kb_id } = useAppSelector(state => state.config)
  const [data, setData] = useState<ITreeItem[]>([])

  const getData = useCallback(() => {
    const params: NodeListFilterData = { kb_id }
    getNodeList(params).then(res => {
      const v = convertToTree(res || [])
      setData(v)
    })
  }, [kb_id])

  const renderTree = (items: ITreeItem[]) => {
    const sortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sortedItems.map(item => (
      <Stack gap={1.5} key={item.id} ml={item.level * 2.5}>
        <Stack direction={'row'} alignItems={'center'} gap={1} sx={{
          cursor: 'pointer',
          fontSize: item.type === 1 ? 16 : 14,
          color: id === item.id ? 'primary.main' : 'text.primary',
          '&:hover': {
            color: 'primary.main',
          }
        }}
          onClick={() => {
            if (item.type === 2) navigate(`/doc/editor/${item.id}`)
          }}
        >
          <Icon type={item.type === 1 ? 'icon-wenjianjia' : 'icon-wenjian'} sx={{ fontSize: 14, color: '#2f80f7', flexShrink: 0 }} />
          <Ellipsis>{item.name}</Ellipsis>
        </Stack>
        {item.children && item.children.length > 0 && <Stack gap={1.5}>
          {renderTree(item.children)}
        </Stack>}
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
      fontSize: 16,
      fontWeight: 'bold',
      borderBottom: '2px solid',
      borderColor: 'divider',
    }}>目录</Box>
    <Stack gap={1.5} sx={{
      py: 2,
      px: 3,
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