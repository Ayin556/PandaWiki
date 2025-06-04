import { KnowledgeBaseListItem } from "@/api"
import ShowText from "@/components/ShowText"
import { Box, Button, Stack } from "@mui/material"
import { useEffect, useState } from "react"

const CardRebotApi = ({ kb }: { kb: KnowledgeBaseListItem }) => {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    const urls: string[] = []
    kb.access_settings?.hosts?.forEach(host => {
      kb.access_settings.ports?.forEach(port => {
        if (port === 80) urls.push(`http://${host}/share/v1/chat/message`)
        else urls.push(`http://${host}:${port}/share/v1/chat/message`)
      })
    })
    kb.access_settings.ssl_ports?.forEach(port => {
      kb.access_settings.hosts?.forEach(host => {
        if (port === 443) urls.push(`https://${host}/share/v1/chat/message`)
        else urls.push(`https://${host}:${port}/share/v1/chat/message`)
      })
    })
    setUrls(urls)
  }, [kb])

  return <>
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
      }}>问答机器人 API </Box>
    </Stack>
    <Box sx={{ m: 2 }}>
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ my: 1, fontSize: 14, lineHeight: '32px' }}>
        <Box>API_URL</Box>
        <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b60-100e-7b23-9385-e36763df5c0a' target="_blank">使用方法</Button>
      </Stack>
      <Stack gap={1}>
        {urls.map((it, index) => <ShowText
          key={index}
          text={it}
        />)}
      </Stack>
      {/* <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ my: 1, fontSize: 14, lineHeight: '32px' }}>
        <Box>API_KEY</Box>
      </Stack>
      <ShowText showIcon={false} text='******************************************' /> */}
    </Box>
  </>
}

export default CardRebotApi