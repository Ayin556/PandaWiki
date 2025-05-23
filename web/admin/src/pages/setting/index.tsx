import { useAppSelector } from "@/store"
import { Stack } from "@mui/material"
import CardKB from "./component/CardKB"
import CardRebot from "./component/CardRebot"
import CardWeb from "./component/CardWeb"

const Setting = () => {
  const { kb_id, kbList } = useAppSelector(state => state.config)
  const kb = kbList.find(it => it.id === kb_id)

  if (!kb) return <></>

  return <Stack direction={'row'} gap={2}>
    <Stack gap={2} sx={{ width: 'calc((100% - 16px) / 2)' }}>
      <CardKB kb={kb} kbList={kbList} />
      <CardRebot />
    </Stack>
    <Stack gap={2} sx={{ width: 'calc((100% - 16px) / 2)' }}>
      <CardWeb />
    </Stack>
  </Stack>
}
export default Setting