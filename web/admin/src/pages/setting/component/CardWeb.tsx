import { getAppDetail, KnowledgeBaseListItem } from "@/api"
import Card from "@/components/Card"
import ShowText from "@/components/ShowText"
import { Box, Button, Divider, Stack } from "@mui/material"
import { useEffect, useState } from "react"
import CardWebCustomCode from "./CardWebCustomCode"
import CardWebHeader from "./CardWebHeader"
import CardWebSEO from "./CardWebSEO"
import CardWebWelcome from "./CardWebWelcome"
import UpdateKbUrl from "./UpdateKbUrl"

interface CardWebProps {
  kb: KnowledgeBaseListItem
  refresh: () => void
}

const CardWeb = ({ kb, refresh }: CardWebProps) => {
  const [info, setInfo] = useState<any>({})
  const [open, setOpen] = useState(false)

  const getInfo = async () => {
    const res = await getAppDetail({ kb_id: kb.id, type: 1 })
    setInfo(res)
  }

  useEffect(() => {
    getInfo()
  }, [kb])

  if (!info.id) return <></>

  return <Card>
    <Box sx={{ fontWeight: 'bold', px: 2, py: 1.5, bgcolor: 'background.paper2' }}>门户网站</Box>
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
      fontWeight: 'bold',
    }}>
      <Box sx={{
        '&::before': {
          content: '""',
          display: 'inline-block',
          width: 4,
          height: 12,
          bgcolor: 'common.black',
          borderRadius: '2px',
          mr: 1,
        },
      }}>
        访问方式
      </Box>
      <Button variant="outlined" size="small" onClick={() => setOpen(true)}>设置</Button>
    </Stack>
    <Stack gap={2} sx={{ mx: 2 }}>
      {kb.access_settings?.hosts?.map((it: string) => {
        const url: string[] = []
        kb.access_settings.ports?.forEach(port => {
          if (port === 80) url.push(`http://${it}`)
          else url.push(`http://${it}:${port}`)
        })
        kb.access_settings.ssl_ports?.forEach(port => {
          if (port === 443) url.push(`https://${it}`)
          else url.push(`https://${it}:${port}`)
        })
        return url.map((it, index) => <ShowText
          key={index}
          text={it}
          copyable={false}
          onClick={() => {
            window.open(it, '_blank')
          }}
        />)
      })}
    </Stack>
    <Divider sx={{ my: 2 }} />
    <CardWebHeader
      id={info.id}
      data={info}
      refresh={(value) => {
        setInfo({
          ...info,
          settings: {
            ...info.settings,
            ...value,
          }
        })
      }}
    />
    <Divider sx={{ my: 2 }} />
    <CardWebWelcome
      id={info.id}
      data={info}
      refresh={(value) => {
        setInfo({
          ...info,
          settings: {
            ...info.settings,
            ...value,
          }
        })
      }}
    />
    <Divider sx={{ my: 2 }} />
    <CardWebSEO
      id={info.id}
      data={info}
      refresh={(value) => {
        setInfo({
          ...info,
          settings: {
            ...info.settings,
            ...value,
          }
        })
      }}
    />
    <Divider sx={{ my: 2 }} />
    <CardWebCustomCode
      id={info.id}
      data={info}
      refresh={(value) => {
        setInfo({
          ...info,
          settings: {
            ...info.settings,
            ...value,
          }
        })
      }}
    />
    <UpdateKbUrl
      open={open}
      data={kb}
      onCancel={() => setOpen(false)}
      refresh={refresh}
    />
  </Card>
}
export default CardWeb