'use client'

import { NodeListItem } from "@/assets/type";
import { useKBDetail } from "@/provider/kb-provider";
import { addExpandState, convertToTree, filterEmptyFolders } from "@/utils/drag";
import { Box } from "@mui/material";
import CatalogFolder from "./CatalogFolder";

const Catalog = ({ nodes, activeId, onChange }: { nodes: NodeListItem[], activeId: string, onChange: (id: string) => void }) => {
  const { kbDetail } = useKBDetail()
  const catalogFolderExpand = kbDetail?.settings?.catalog_expanded !== 2
  const tree = addExpandState(filterEmptyFolders(convertToTree(nodes) || []), activeId, catalogFolderExpand)

  return <Box sx={{
    width: 216,
    px: 2,
    py: 3,
    fontSize: 12,
    position: 'fixed',
    zIndex: 5,
    borderRight: '1px solid',
    borderColor: 'divider',
    lineHeight: '22px',
    color: 'text.primary',
    bgcolor: 'background.paper',
  }}>
    <Box sx={{
      px: 2,
      pb: 1,
      lineHeight: '22px',
      fontSize: 14,
      fontWeight: 'bold',
    }}>目录</Box>
    <Box sx={{
      pl: 2,
      height: 'calc(100vh - 78px)',
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