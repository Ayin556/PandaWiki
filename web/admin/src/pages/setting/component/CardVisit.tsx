import { KnowledgeBaseListItem, updateKnowledgeBase } from "@/api"
import { validateUrl } from "@/utils"
import { Box, Button, Stack, TextField, Tooltip } from "@mui/material"
import { Icon, Message } from "ct-mui"
import { useEffect, useState } from "react"
import UpdateKbUrl from "./UpdateKbUrl"

const CardVisit = ({ kb, refresh }: { kb: KnowledgeBaseListItem, refresh: () => void }) => {

  const [url, setUrl] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [isEdit, setIsEdit] = useState<boolean>(false)


  const handleSave = () => {
    try {
      if (!validateUrl(url)) {
        throw new Error('请输入正确的网址')
      }

      updateKnowledgeBase({ id: kb.id, access_settings: { ...kb.access_settings, base_url: url } }).then(() => {
        Message.success('保存成功')
        setIsEdit(false)
        refresh()
      })
    } catch (e) {
      Message.error('请输入正确的网址')
    }
  }

  useEffect(() => {
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
      }}>
        访问方式
      </Box>
      <Button variant="outlined" size="small" onClick={() => setOpen(true)}>设置</Button>
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ fontSize: 14, lineHeight: '32px', my: 1, mx: 2 }}>
      Wiki 网站地址
      <Tooltip arrow placement='top' title='请输入 Wiki 网站的根路径，用于生成访问链接，例如 https://wiki.panda.com'>
        <Icon type='icon-a-wenhao8' sx={{ fontSize: 16, color: 'text.disabled', cursor: 'pointer', '&:hover': { color: 'text.auxiliary' } }} />
      </Tooltip>
    </Stack>
    <Box sx={{ mx: 2 }}>
      <TextField
        fullWidth
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          setIsEdit(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave()
          }
        }}
        placeholder='请输入 Wiki 网站的根路径，用于生成访问链接，例如 https://wiki.panda.com'
        InputProps={{
          endAdornment: isEdit && <Button variant="contained" size="small" sx={{ ml: 1.5 }} onClick={handleSave}>保存</Button>
        }}
      />
    </Box>
    <UpdateKbUrl
      open={open}
      data={kb}
      onCancel={() => setOpen(false)}
      refresh={refresh}
    />
  </>
}

export default CardVisit