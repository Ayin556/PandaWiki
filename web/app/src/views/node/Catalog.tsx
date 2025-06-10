'use client'

import { NodeListItem } from "@/assets/type";
import { convertToTree } from "@/utils/drag";
import { Box } from "@mui/material";
import CatalogFolder from "./CatalogFolder";

const Catalog = ({ nodes, activeId, onChange }: { nodes: NodeListItem[], activeId: string, onChange: (id: string) => void }) => {
  const tree = convertToTree(nodes)

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
      ml: -2,
      pl: 2
    }}>目录</Box>
    <Box sx={{
      ml: -2,
      pl: 2,
      height: 'calc(100vh - 174px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      {tree.map((item) => <CatalogFolder key={item.id} item={item} activeId={activeId} onChange={onChange} />)}
    </Box>
  </Box>
};

export default Catalog;