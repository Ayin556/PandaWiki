import { getKnowledgeBaseDetail, KnowledgeBaseListItem } from "@/api"
import { useAppSelector } from "@/store"
import { Stack } from "@mui/material"
import { useEffect, useState } from "react"
import CardKB from "./component/CardKB"
import CardRebot from "./component/CardRebot"
import CardWeb from "./component/CardWeb"

const Setting = () => {
  const { kb_id } = useAppSelector(state => state.config)
  const [kb, setKb] = useState<KnowledgeBaseListItem | null>(null)

  const getKb = () => {
    if (!kb_id) return
    getKnowledgeBaseDetail({ id: kb_id }).then(res => setKb(res))
  }

  useEffect(() => {
    if (kb_id) getKb()
  }, [kb_id])

  if (!kb) return <></>

  return <Stack direction={'row'} gap={2} sx={{ pb: 2 }}>
    <Stack gap={2} sx={{ width: 'calc((100% - 16px) / 2)' }}>
      <CardKB kb={kb} />
      <CardRebot kb={kb} />
    </Stack>
    <Stack gap={2} sx={{ width: 'calc((100% - 16px) / 2)' }}>
      <CardWeb kb={kb} refresh={getKb} />
    </Stack>
  </Stack>
}
export default Setting