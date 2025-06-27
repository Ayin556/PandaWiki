import { getKnowledgeBaseDetail, KnowledgeBaseListItem } from "@/api"
import { useAppSelector } from "@/store"
import { Stack } from "@mui/material"
import { useEffect, useState } from "react"
import CardAI from "./component/CardAI"
import CardKB from "./component/CardKB"
import CardRebot from "./component/CardRebot"
import CardWeb from "./component/CardWeb"

const Setting = () => {
  const { kb_id } = useAppSelector(state => state.config)
  const [kb, setKb] = useState<KnowledgeBaseListItem | null>(null)
  const [url, setUrl] = useState<string>('')

  const getKb = () => {
    if (!kb_id) return
    getKnowledgeBaseDetail({ id: kb_id }).then(res => setKb(res))
  }

  useEffect(() => {
    if (kb) {
      if (kb.access_settings.base_url) {
        setUrl(kb.access_settings.base_url)
        return
      }

      let defaultUrl: string = ''
      const host = kb.access_settings?.hosts?.[0] || ''
      if (!host) return

      if (kb.access_settings.ssl_ports && kb.access_settings.ssl_ports.length > 0) {
        defaultUrl = kb.access_settings.ssl_ports.includes(443) ? `https://${host}` : `https://${host}:${kb.access_settings.ssl_ports[0]}`
      } else if (kb.access_settings.ports && kb.access_settings.ports.length > 0) {
        defaultUrl = kb.access_settings.ports.includes(80) ? `http://${host}` : `http://${host}:${kb.access_settings.ports[0]}`
      }

      setUrl(defaultUrl)
    }
  }, [kb])

  useEffect(() => {
    if (kb_id) getKb()
  }, [kb_id])

  if (!kb) return <></>

  return <Stack direction={'row'} gap={2} sx={{ pb: 2 }}>
    <Stack gap={2} sx={{ width: 'calc((100% - 16px) / 2)' }}>
      <CardKB kb={kb} />
      <CardAI kb={kb} />
      <CardRebot kb={kb} url={url} />
    </Stack>
    <Stack gap={2} sx={{ width: 'calc((100% - 16px) / 2)' }}>
      <CardWeb kb={kb} refresh={getKb} />
    </Stack>
  </Stack>
}
export default Setting