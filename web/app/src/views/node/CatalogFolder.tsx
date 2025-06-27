import { ITreeItem } from "@/assets/type"
import { IconArrowDown, IconFile, IconFolder } from "@/components/icons"
import { useStore } from "@/provider"
import { Box, Stack } from "@mui/material"
import { Ellipsis } from "ct-mui"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

const CatalogFolder = ({ item, depth = 1 }: { item: ITreeItem, depth?: number }) => {
  const { id: activeId }: { id: string } = useParams()
  const [isExpanded, setIsExpanded] = useState(item.defaultExpand ?? true)
  const { themeMode = 'light' } = useStore()

  return <Box key={item.id}>
    <Box sx={{
      position: 'relative',
      lineHeight: '36px',
      cursor: 'pointer',
      borderRadius: '10px',
      color: activeId === item.id ? 'primary.main' : 'inherit',
      fontWeight: activeId === item.id ? 'bold' : 'normal',
      '&:hover': {
        bgcolor: themeMode === 'dark' ? '#394052' : 'background.default'
      }
    }} onClick={() => {
      setIsExpanded(!isExpanded)
    }}>
      {item.type === 1 && <Box sx={{ position: 'absolute', left: (2 * depth - 1) * 8, top: 4, color: 'text.disabled' }}>
        <IconArrowDown sx={{ fontSize: 16, transform: isExpanded ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
      </Box>}
      <Link href={item.type === 2 ? `/node/${item.id}` : ''} prefetch={false}>
        <Box sx={{
          pl: (depth + 0.5) * 2,
        }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            {item.emoji ? <Box sx={{ flexShrink: 0, fontSize: 12 }}>{item.emoji}</Box>
              : item.type === 1 ? <IconFolder sx={{ flexShrink: 0, fontSize: 12 }} />
                : <IconFile sx={{ flexShrink: 0, fontSize: 12 }} />}
            <Ellipsis sx={{ flex: 1, width: 0, pr: 1 }}>
              {item.name}
            </Ellipsis>
          </Stack>
        </Box>
      </Link>
    </Box>
    {item.children && item.children.length > 0 && isExpanded && (<>
      {item.children.map((child) =>
        <CatalogFolder key={child.id} depth={depth + 1} item={child} />
      )}
    </>)}
  </Box >
}

export default CatalogFolder