'use client'

import docHeaderBgi from '@/assets/images/doc-header-bg.png'
import { ITreeItem, NodeListItem } from "@/assets/type"
import { IconArrowDown, IconFile, IconFolder, IconNav } from "@/components/icons"
import { StyledHeaderBgi } from "@/components/StyledHTML"
import { convertToTree } from '@/utils/drag'
import { Box, Stack } from "@mui/material"
import { Ellipsis } from 'ct-mui'
import { useEffect, useState } from "react"

const CatalogH5 = ({
  activeId,
  nodes,
  onChange,
}: {
  activeId: string
  nodes: NodeListItem[]
  onChange: (id: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const tree = convertToTree(nodes)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const renderNode = (item: ITreeItem) => (
    <Box key={item.id}>
      <Box sx={{
        lineHeight: '32px',
        cursor: 'pointer',
        color: activeId === item.id ? 'primary.main' : 'inherit',
        fontWeight: activeId === item.id ? 'bold' : 'normal',
        '&:hover': { color: 'primary.main' }
      }}>
        <Stack direction="row" alignItems="center" gap={1}>
          {item.type === 1 ? <IconFolder sx={{ flexShrink: 0 }} /> : <IconFile sx={{ flexShrink: 0 }} />}
          {item.type === 2 ? <Box sx={{ flex: 1, width: 0 }}>
            <Ellipsis onClick={(event) => {
              event.stopPropagation()
              onChange(item.id)
              setOpen(false)
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
      {item.children && item.children.length > 0 && (
        <Box sx={{ ml: 2.5 }}>
          {item.children.map((child) =>
            renderNode(child)
          )}
        </Box>
      )}
    </Box>
  )

  return <Box sx={{
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1,
  }}>
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '76px',
      overflow: 'hidden',
    }}>
      <StyledHeaderBgi
        bgi={docHeaderBgi.src}
        sx={{
          position: 'absolute',
          backgroundSize: 'cover',
          zIndex: 1,
          mt: '-60px',
        }}
      />
    </Box>
    <Stack direction='row' alignItems='center' justifyContent='space-between'
      sx={{
        py: 3,
        mx: 3,
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
      onClick={() => setOpen(!open)}>
      <Stack direction='row' alignItems='center' gap={1}>
        <IconNav sx={{ fontSize: 18 }} />
        <Box sx={{
          fontSize: 20,
          fontWeight: 'bold',
          color: 'text.primary',
        }}>目录</Box>
      </Stack>
      <IconArrowDown sx={{
        fontSize: 24,
        transform: open ? 'rotate(-180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease-in-out',
        cursor: 'pointer',
      }} />
    </Stack>
    <Box sx={{
      px: 3,
      height: open ? 'calc(100vh - 137px)' : '0px',
      transition: 'height 0.3s ease-in-out',
      bgcolor: 'background.default',
      overflowY: 'auto',
      overflowX: 'hidden',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      <Box sx={{ py: 3 }}>
        {tree.map((item) => renderNode(item))}
      </Box>
    </Box>
  </Box>
}

export default CatalogH5