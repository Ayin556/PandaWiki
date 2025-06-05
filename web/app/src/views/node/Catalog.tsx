'use client'

import { ITreeItem, NodeListItem } from "@/assets/type";
import { IconFile, IconFolder } from "@/components/icons";
import { convertToTree } from "@/utils/drag";
import { Box, Stack } from "@mui/material";
import { Ellipsis } from "ct-mui";

const Catalog = ({ nodes, activeId, onChange }: { nodes: NodeListItem[], activeId: string, onChange: (id: string) => void }) => {
  const tree = convertToTree(nodes)

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
    width: 250,
    pr: 3,
    fontSize: 14,
    position: 'fixed',
    borderRight: '1px solid',
    borderColor: 'divider',
    lineHeight: '22px',
    color: 'text.primary',
  }}>
    <Box sx={{
      fontSize: 16,
      fontWeight: 'bold',
      mb: 2,
    }}>目录</Box>
    <Box sx={{
      height: 'calc(100vh - 174px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      {tree.map((item) => renderNode(item))}
    </Box>
  </Box>
};

export default Catalog;