import { addOpacityToColor } from "@/utils"
import { Box, Button, Stack, useTheme } from "@mui/material"
import { MenuSelect } from "ct-mui"
import { useState } from "react"
import DocAddByCustomText from "./DocAddByCustomText"
import DocAddByUrl from "./DocAddByUrl"

interface InputContentProps {
  refresh: () => void
}

const DocAdd = ({ refresh }: InputContentProps) => {
  const theme = useTheme()
  const [customDocOpen, setCustomDocOpen] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [key, setKey] = useState<'OfflineFile' | 'URL' | 'RSS' | 'Sitemap'>('URL')
  const [docFileKey, setDocFileKey] = useState<'docFile' | 'customDoc'>('docFile')

  const ImportContentWays = {
    docFile: {
      label: '创建文件夹',
      onClick: () => {
        setDocFileKey('docFile')
        setCustomDocOpen(true)
      }
    },
    customDoc: {
      label: '创建文档',
      onClick: () => {
        setDocFileKey('customDoc')
        setCustomDocOpen(true)
      }
    },
    URL: {
      label: '通过 URL 导入',
      onClick: () => {
        setUrlOpen(true)
      }
    },
    RSS: {
      label: '通过 RSS 导入',
      onClick: () => {
        setUrlOpen(true)
        setKey('RSS')
      }
    },
    Sitemap: {
      label: '通过 Sitemap 导入',
      onClick: () => {
        setUrlOpen(true)
        setKey('Sitemap')
      }
    },
    OfflineFile: {
      label: '通过离线文件导入',
      onClick: () => {
        setUrlOpen(true)
        setKey('OfflineFile')
      }
    },
  }

  const close = () => {
    setUrlOpen(false)
    setCustomDocOpen(false)
  }

  return <Box>
    <MenuSelect list={Object.entries(ImportContentWays).map(([key, value]) => ({
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
    <DocAddByUrl type={key} open={urlOpen} refresh={refresh} onCancel={close} />
    <DocAddByCustomText type={docFileKey} open={customDocOpen} refresh={refresh} onClose={() => setCustomDocOpen(false)} />
  </Box>
}

export default DocAdd