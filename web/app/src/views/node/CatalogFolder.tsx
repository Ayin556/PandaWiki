import { ITreeItem } from "@/assets/type"
import { IconArrowDown, IconFile, IconFolder } from "@/components/icons"
import { useMobile } from "@/provider/mobile-provider"
import { Box, Stack } from "@mui/material"
import { Ellipsis } from "ct-mui"
import { useState } from "react"

const CatalogFolder = ({ item, activeId, onChange }: { item: ITreeItem, activeId: string, onChange: (id: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const { mobile } = useMobile()

  return <Box key={item.id}>
    <Box sx={{
      position: 'relative',
      lineHeight: '32px',
      cursor: 'pointer',
      color: activeId === item.id ? 'primary.main' : 'inherit',
      fontWeight: activeId === item.id ? 'bold' : 'normal',
      '&:hover': { color: 'primary.main' }
    }} onClick={() => {
      setIsExpanded(!isExpanded)
    }}>
      {item.type === 1 && <Box sx={{ position: 'absolute', left: -18, top: 2 }}>
        <IconArrowDown sx={{ fontSize: 16, transform: isExpanded ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
      </Box>}
      <Stack direction="row" alignItems="center" gap={1}>
        {item.emoji ? <Box sx={{ flexShrink: 0, fontSize: 12 }}>{item.emoji}</Box> : item.type === 1 ? <IconFolder sx={{ flexShrink: 0 }} /> : <IconFile sx={{ flexShrink: 0 }} />}
        {item.type === 2 ? <Box sx={{ flex: 1, width: 0 }}>
          <Ellipsis onClick={(event) => {
            event.stopPropagation()
            onChange(item.id)
            window.history.pushState(null, '', `/node/${item.id}`)
          }}>
            {item.name}
          </Ellipsis>
        </Box> : <Box sx={{ flex: 1, width: 0 }}>
          <Ellipsis>
            {item.name}
          </Ellipsis>
        </Box>}
      </Stack>
    </Box>
    {item.children && item.children.length > 0 && isExpanded && (
      <Box sx={{ ml: mobile ? 3 : 2.75 }}>
        {item.children.map((child) =>
          <CatalogFolder key={child.id} item={child} activeId={activeId} onChange={onChange} />
        )}
      </Box>
    )}
  </Box>
}

export default CatalogFolder