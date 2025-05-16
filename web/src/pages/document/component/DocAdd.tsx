import { createDoc, parseDocUrl } from "@/api"
import Card from "@/components/Card"
import { useAppSelector } from "@/store"
import { addOpacityToColor } from "@/utils"
import { Box, Button, Checkbox, Stack, TextField, useTheme } from "@mui/material"
import { Ellipsis, Icon, MenuSelect, Modal } from "ct-mui"
import dayjs from "dayjs"
import { useState } from "react"
import { Virtuoso } from "react-virtuoso"
import DocAddByCustomText from "./DocAddByCustomText"
import DocAddByUploadOfflineFile from "./DocAddByUploadOfflineFile"

interface InputContentProps {
  refresh?: () => void
}

const DocAdd = ({ refresh }: InputContentProps) => {
  const theme = useTheme()
  const { kb_id: id } = useAppSelector(state => state.config)
  const [key, setKey] = useState<'URL' | 'RSS' | 'Sitemap'>('URL')
  const [addressOpen, setAddressOpen] = useState(false)
  const [offlineFileOpen, setOfflineFileOpen] = useState(false)
  const [customDocOpen, setCustomDocOpen] = useState(false)
  const [urls, setUrls] = useState<string[]>([])
  const [items, setItems] = useState<{ title: string, url: string, published: string, desc: string }[]>([])
  const [url, setUrl] = useState<string>('')
  const [selectUrls, setSelectUrls] = useState<string[]>([])
  const [selectUrlsOpen, setSelectUrlsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const ImportContentWays = {
    customDoc: {
      label: '创建文档',
      onClick: () => setCustomDocOpen(true)
    },
    URL: {
      label: '通过 URL 导入',
      onClick: () => {
        setAddressOpen(true)
        setKey('URL')
      }
    },
    RSS: {
      label: '通过 RSS 导入',
      onClick: () => {
        setAddressOpen(true)
        setKey('RSS')
      }
    },
    Sitemap: {
      label: '通过 Sitemap 导入',
      onClick: () => {
        setAddressOpen(true)
        setKey('Sitemap')
      }
    },
    offlineFile: {
      label: '通过离线文件导入',
      onClick: () => setOfflineFileOpen(true)
    },
  }

  const submit = () => {
    if (!id) return
    if (['Sitemap', 'RSS'].includes(key)) {
      setLoading(true)
      console.log(key, url, id)
      parseDocUrl({ type: key, url, kb_id: id }).then((res) => {
        console.log(res)
        setItems(res.items || [])
        setAddressOpen(false)
        setKey('URL')
        setSelectUrlsOpen(true)
      }).finally(() => {
        setLoading(false)
      })
      return
    }
    const urlArray = (selectUrls.length > 0 ? selectUrls : urls).filter(it => it.startsWith('http'))
    if (urlArray.length === 0) return
    setLoading(true)
    createDoc({ url: urlArray, source: 1, kb_id: id }).then(() => {
      close()
      if (refresh) refresh()
    }).finally(() => {
      setLoading(false)
    })
  }

  const close = () => {
    setUrl('')
    setUrls([])
    setItems([])
    setSelectUrls([])
    setLoading(false)
    setAddressOpen(false)
    setCustomDocOpen(false)
    setSelectUrlsOpen(false)
    setOfflineFileOpen(false)
  }
  console.log(items)

  return <Box>
    <MenuSelect type='button' list={Object.entries(ImportContentWays).map(([key, value]) => ({
      key,
      label: <Box key={key}>
        <Stack
          direction={'row'}
          alignItems={'center'}
          gap={1}
          sx={{
            fontSize: 14, px: 2, lineHeight: '40px', height: 40, width: 180,
            borderRadius: '5px',
            cursor: 'pointer', ':hover': { bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1) }
          }}
          onClick={value.onClick}
        >
          {value.label}
        </Stack>
        {key === 'customDoc' && <Box sx={{ borderBottom: '1px solid', borderColor: theme.palette.divider, my: 0.5 }} />}
      </Box>
    }))} context={<Button variant='contained'>
      创建文档
    </Button>} />
    <Modal
      title='选择 URL 导入'
      open={selectUrlsOpen}
      width={600}
      onCancel={close}
      onOk={submit}
      okButtonProps={{ loading }}
    >
      <Card sx={{
        fontSize: 14,
        p: 1,
        maxHeight: 'calc(100vh - 250px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        bgcolor: 'background.paper2',
      }}>
        <Stack direction='row' gap={2} sx={{
          borderBottom: '1px solid',
          borderColor: theme.palette.divider,
          py: 1,
        }}>
          <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ width: '100%' }}>
            <Checkbox size="small" checked={selectUrls.length === items.length} onChange={(event) => {
              if (event.target.checked) {
                setSelectUrls(items.map(it => it.url))
              } else {
                setSelectUrls([])
              }
            }} />
            <Ellipsis sx={{ width: 'calc(100% - 30px)', fontSize: 13 }}>全选</Ellipsis>
          </Stack>
        </Stack>
        {items.length > 0 && <Virtuoso
          data={items}
          style={{
            height: 56 * items.length,
            maxHeight: 'calc(100vh - 321px)',
            overflowX: 'hidden'
          }}
          itemContent={(_, it) => <Stack direction='row' gap={2} key={it.url} sx={{
            borderBottom: '1px solid',
            borderColor: theme.palette.divider,
            py: 1,
          }}>
            <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ width: '100%' }}>
              <Checkbox size="small" sx={{ flexShrink: 0 }} checked={selectUrls.includes(it.url)} onChange={(event) => {
                if (event.target.checked) {
                  setSelectUrls([...selectUrls, it.url])
                } else {
                  const idx = selectUrls.indexOf(it.url)
                  setSelectUrls([...selectUrls.slice(0, idx), ...selectUrls.slice(idx + 1)])
                }
              }} />
              <Box sx={{ flexGrow: 1 }}>
                <Ellipsis sx={{ fontSize: 13 }}>{it.title || it.url}</Ellipsis>
                {it.title && <Ellipsis sx={{ fontSize: 12, color: 'text.auxiliary' }}>{it.url}</Ellipsis>}
              </Box>
              {it.published && <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ fontSize: 12, flexShrink: 0, fontFamily: 'G', width: 85, color: 'text.auxiliary' }}>
                <Icon type='icon-a-shijian2' />
                {dayjs(it.published).format('YYYY-MM-DD')}
              </Stack>}
            </Stack>
          </Stack>}
        />}
      </Card>
    </Modal>
    <Modal
      title={ImportContentWays[key as keyof typeof ImportContentWays].label}
      open={addressOpen}
      width={600}
      onCancel={close}
      onOk={submit}
      okButtonProps={{ loading }}
    >
      {key === 'URL' ? <TextField
        fullWidth
        multiline={true}
        rows={4}
        value={urls.join('\n')}
        placeholder='每行一个 URL'
        autoFocus
        onChange={(e) => setUrls(e.target.value.split('\n'))}
      /> :
        <TextField
          fullWidth
          autoFocus
          value={url}
          placeholder={key + ' 地址'}
          onChange={(e) => setUrl(e.target.value)}
        />}
    </Modal>
    <DocAddByUploadOfflineFile open={offlineFileOpen} refresh={refresh} onClose={() => setOfflineFileOpen(false)} />
    <DocAddByCustomText open={customDocOpen} refresh={refresh} onClose={() => setCustomDocOpen(false)} />
  </Box>
}

export default DocAdd