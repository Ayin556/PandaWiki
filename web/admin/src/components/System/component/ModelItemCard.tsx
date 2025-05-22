import { ModelListItem } from "@/api"
import Logo from '@/assets/images/logo.png'
import Avatar from "@/components/Avatar"
import Card from "@/components/Card"
import { IconMap, ModelProvider } from "@/constant/enums"
import { addOpacityToColor } from "@/utils"
import { Box, Button, Stack, useTheme } from "@mui/material"
import { Ellipsis, Icon } from "ct-mui"
import { useState } from "react"
import ModelAdd from "./ModelAdd"
import ModelDel from "./ModelDel"
import ModelUse from "./ModelUse"

interface ModelItemCardProps {
  it: ModelListItem
  refresh: () => void
}

const ModelItemCard = ({ it, refresh }: ModelItemCardProps) => {
  const theme = useTheme()
  const [useOpen, setUseOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  return <Card sx={{
    p: 2,
    width: 'calc((100% - 32px) / 3)',
    overflow: 'hidden',
    border: '1px solid',
    borderColor: it.is_active ? 'primary.main' : 'common.white',
    boxShadow: '0px 0px 10px 0px rgba(54,59,76,0.1), 0px 0px 1px 1px rgba(54,59,76,0.03)',
    '&:hover': {
      boxShadow: '0px 10px 30px 0px rgba(54,59,76,0.3), 0px 0px 1px 1px rgba(54,59,76,0.03)',
      '.app-item-card-icon-button': {
        bgcolor: addOpacityToColor(theme.palette.primary.main, 0.2),
        color: 'text.inverse',
      }
    }
  }}>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={2}>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        {IconMap[it.model] ?
          <Icon type={IconMap[it.model]} sx={{ fontSize: 40 }} />
          : ModelProvider[it.provider as keyof typeof ModelProvider] ?
            <Icon type={ModelProvider[it.provider as keyof typeof ModelProvider].icon} sx={{ fontSize: 40 }} />
            : <Avatar src={Logo} />}
        <Ellipsis sx={{ fontWeight: 'bold', lineHeight: '24px', fontSize: 16 }}>{it.model}</Ellipsis>
      </Stack>
      {it.is_active && <Box sx={{
        flexShrink: 0,
        bgcolor: 'primary.main',
        lineHeight: '20px',
        color: 'text.inverse',
        fontSize: 12,
        px: 1,
        borderRadius: '10px',
      }}>正在使用</Box>}
    </Stack>
    <Box sx={{
      mt: 2,
      lineHeight: '20px',
      fontSize: 12,
      color: 'text.auxiliary',
      borderBottom: '1px dashed',
      borderColor: 'divider',
      pb: 2,
    }}>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ height: 20 }}>
        输入 Token 使用
        <Box sx={{ fontWeight: 'bold', color: 'text.primary' }}>{it.prompt_tokens}</Box>
      </Stack>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ mt: 1, height: 20 }}>
        输出 Token 使用
        <Box sx={{ fontWeight: 'bold', color: 'text.primary' }}>{it.completion_tokens}</Box>
      </Stack>
    </Box>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'flex-end'} sx={{ mt: 2 }}>
      <Stack direction={'row'} alignItems={'center'} gap={2}>
        {!it.is_active && <Button size="small" sx={{ minWidth: 'auto', px: 0, height: 24 }} onClick={() => {
          setUseOpen(true)
        }}>
          使用
        </Button>}
        <Button size="small" sx={{ minWidth: 'auto', px: 0, height: 24 }} onClick={() => setEditOpen(true)}>
          修改
        </Button>
        {!it.is_active && <Button size="small" sx={{ minWidth: 'auto', px: 0, height: 24 }} color="error" onClick={() => {
          setDelOpen(true)
        }}>
          删除
        </Button>}
      </Stack>
    </Stack>
    <ModelUse open={useOpen} onClose={() => setUseOpen(false)} data={it} refresh={refresh} />
    <ModelDel open={delOpen} onClose={() => setDelOpen(false)} data={it} refresh={refresh} />
    <ModelAdd open={editOpen} onClose={() => setEditOpen(false)} data={it} refresh={refresh} />
  </Card>
}

export default ModelItemCard