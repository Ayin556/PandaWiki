'use client'

import { NodeDetail } from "@/assets/type";
import { useKBDetail } from "@/provider/kb-provider";
import { useMobile } from "@/provider/mobile-provider";
import { useNodeList } from "@/provider/nodelist-provider";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Fab, Stack, Zoom } from "@mui/material";
import { useTiptapEditor } from "ct-tiptap-editor";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Catalog from "./Catalog";
import CatalogH5 from "./CatalogH5";
import DocAnchor from "./DocAnchor";
import DocContent from "./DocContent";
import useScroll from "./useScroll";

const Doc = ({ node: defaultNode }: { node?: NodeDetail }) => {
  const { id: defaultId } = useParams()

  const { nodeList } = useNodeList()
  const { kb_id } = useKBDetail()
  const { mobile } = useMobile()

  const [id, setId] = useState(defaultId as string || '')
  const [node, setNode] = useState<NodeDetail | undefined>(defaultNode)
  const [headings, setHeadings] = useState<{ id: string, title: string, heading: number }[]>([])

  const [maxH, setMaxH] = useState(0)
  const editorRef = useTiptapEditor({
    content: node?.content || '',
    editable: false,
  })

  const { activeHeading } = useScroll(headings)

  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getData = async (id: string) => {
    try {
      const res = await fetch(`/share/v1/node/detail?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-kb-id': kb_id || '',
        }
      });
      const result = await res.json()
      setNode(result.data as NodeDetail)
    } catch (error) {
      console.error('Error fetching document content:', error);
    }
  }

  useEffect(() => {
    if (node) {
      if (editorRef) {
        editorRef.setContent(node?.content || '').then((headings) => {
          setHeadings(headings)
          setMaxH(Math.min(...headings.map(h => h.heading)))
        })
      }
    }
  }, [node])

  useEffect(() => {
    getData(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (mobile) {
    return <Box sx={{ mt: '60px', position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 201px)' }}>
      {nodeList && <CatalogH5 activeId={id} nodes={nodeList} onChange={setId} />}
      {node && <DocContent info={node} editorRef={editorRef} />}
      <Zoom in={showScrollTop}>
        <Fab
          size="small"
          onClick={scrollToTop}
          sx={{
            backgroundColor: '#fff',
            color: '#000',
            position: 'fixed',
            bottom: 66,
            right: 16,
            zIndex: 1000,
          }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: 24 }} />
        </Fab>
      </Zoom>
    </Box>
  }

  return <Stack direction='row' alignItems={'stretch'} sx={{ mt: '92px', position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 132px)' }}>
    {nodeList && <Catalog activeId={id} nodes={nodeList} onChange={setId} />}
    {node && <DocContent info={node} editorRef={editorRef} />}
    {node && <DocAnchor title={node?.name} headings={headings} maxH={maxH} activeHeading={activeHeading} />}
    <Zoom in={showScrollTop}>
      <Fab
        size="small"
        onClick={scrollToTop}
        sx={{
          backgroundColor: '#fff',
          color: '#000',
          position: 'fixed',
          bottom: 108,
          right: 16,
          zIndex: 1000,
        }}
      >
        <KeyboardArrowUpIcon sx={{ fontSize: 24 }} />
      </Fab>
    </Zoom>
  </Stack>
};

export default Doc;
