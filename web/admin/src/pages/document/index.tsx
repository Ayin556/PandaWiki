import { getNodeList, ITreeItem, NodeDetail, NodeListFilterData } from "@/api"
import Card from "@/components/Card"
import DragTree from "@/components/Drag/DragTree"
import { convertToTree } from "@/constant/drag"
import { useURLSearchParams } from "@/hooks"
import { useAppSelector } from "@/store"
import { Box, Stack } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import DocAdd from "./component/DocAdd"
import DocAddByCustomText from "./component/DocAddByCustomText"
import DocDelete from "./component/DocDelete"
import DocSearch from "./component/DocSearch"
const Content = () => {
  const { kb_id } = useAppSelector(state => state.config)

  const [searchParams] = useURLSearchParams()
  const search = searchParams.get('search') || ''

  const [data, setData] = useState<ITreeItem[]>([])
  const [opraData, setOpraData] = useState<NodeDetail | null>(null)
  const [delOpen, setDelOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)

  const getData = useCallback(() => {
    const params: NodeListFilterData = { kb_id }
    if (search) params.search = search
    getNodeList(params).then(res => {
      const v = convertToTree(res || [])
      setData(v)
    })
  }, [search, kb_id])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && kb_id) {
        getData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getData, kb_id]);

  useEffect(() => {
    if (kb_id) getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, kb_id])

  return <>
    <Card>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ p: 2 }}  >
        <Box sx={{ fontSize: 16, fontWeight: 700 }}>目录</Box>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <DocSearch />
          <DocAdd refresh={getData} />
        </Stack>
      </Stack>
      <Stack sx={{
        height: 'calc(100vh - 148px)',
        overflow: 'hidden',
        overflowY: 'auto',
        px: 2,
      }}>
        <DragTree data={data} refresh={getData} />
      </Stack>
    </Card>
    <DocAddByCustomText open={renameOpen} onClose={() => {
      setRenameOpen(false)
      setOpraData(null)
    }} data={opraData} refresh={getData} />
    <DocDelete open={delOpen} onClose={() => {
      setDelOpen(false)
      setOpraData(null)
    }} data={opraData} refresh={getData} />
  </>
}

export default Content