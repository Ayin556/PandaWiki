import { ITreeItem } from "@/assets/type"
import { IconArrowDown, IconFile, IconFolder } from "@/components/icons"
import { Box, Stack } from "@mui/material"
import { Ellipsis } from "ct-mui"
import { useState } from "react"

const CatalogFolder = ({ item, activeId, onChange, depth = 1 }: { item: ITreeItem, activeId: string, onChange: (id: string) => void, depth?: number }) => {
  const [isExpanded, setIsExpanded] = useState(item.defaultExpand ?? true)

  return <Box key={item.id}>
    <Box sx={{
      pl: depth * 2,
      position: 'relative',
      lineHeight: '36px',
      cursor: 'pointer',
      borderRadius: '10px',
      color: activeId === item.id ? 'primary.main' : 'inherit',
      fontWeight: activeId === item.id ? 'bold' : 'normal',
      bgcolor: activeId === item.id ? 'background.paper' : 'transparent',
      '&:hover': {
        bgcolor: 'background.paper'
      }
    }} onClick={() => {
      setIsExpanded(!isExpanded)
    }}>
      {item.type === 1 && <Box sx={{ position: 'absolute', left: -2, top: 2 }}>
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
      <>
        {item.children.map((child) =>
          <CatalogFolder key={child.id} depth={depth + 1} item={child} activeId={activeId} onChange={onChange} />
        )}
      </>
    )}
  </Box>
}

export default CatalogFolder