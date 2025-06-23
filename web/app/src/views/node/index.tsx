'use client'

import { apiClient } from "@/api";
import { NodeDetail } from "@/assets/type";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { useKBDetail } from "@/provider/kb-provider";
import { useMobile } from "@/provider/mobile-provider";
import { useNodeList } from "@/provider/nodelist-provider";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Fab, Zoom } from "@mui/material";
import { useTiptapEditor } from "ct-tiptap-editor";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Catalog from "./Catalog";
import CatalogH5 from "./CatalogH5";
import DocAnchor from "./DocAnchor";
import DocContent from "./DocContent";
import DocHeader from "./DocHeader";

const Doc = ({ node: defaultNode, token }: { node?: NodeDetail, token?: string }) => {

  const { id: defaultId } = useParams()

  const [firstRequest, setFirstRequest] = useState(true)
  const { nodeList } = useNodeList()
  const { kb_id } = useKBDetail()
  const { mobile } = useMobile()

  const [id, setId] = useState(defaultId as string || '')
  const [node, setNode] = useState<NodeDetail | undefined>(defaultNode)

  const editorRef = useTiptapEditor({
    content: node?.content || '',
    editable: false,
  })


  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = () => {
    setShowScrollTop(window.scrollY > 300);
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
      const result = await apiClient.serverGetNodeDetail(id, kb_id || '', token, window?.location.origin);
      setNode(result.data);
    } catch (error) {
      console.error('page Error fetching document content:', error);
    }
  }

  useEffect(() => {
    if (node && editorRef && editorRef.editor) {
      editorRef.setContent(node?.content || '')
    }
  }, [node])

  useEffect(() => {
    if (!firstRequest) getData(id)
    setFirstRequest(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (mobile) {
    return <Box sx={{ mt: '60px', position: 'relative', zIndex: 1 }}>
      <Box sx={{ minHeight: 'calc(100vh - 100px)' }}>
        <Header />
        {nodeList && <CatalogH5 activeId={id} nodes={nodeList} onChange={setId} />}
        <Box sx={{ height: 24 }} />
        {node && <DocContent info={node} editorRef={editorRef} />}
      </Box>
      <Footer />
      <Zoom in={showScrollTop}>
        <Fab
          size="small"
          onClick={scrollToTop}
          sx={{
            backgroundColor: 'background.paper',
            color: 'text.primary',
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

  return <Box>
    <Catalog activeId={id} nodes={nodeList || []} onChange={setId} />
    <DocHeader />
    <Box sx={{
      pt: '96px',
      position: 'relative',
      zIndex: 1,
      minHeight: 'calc(100vh - 40px)',
      pb: 10,
      bgcolor: 'background.default',
    }}>
      {/* <DocSearch /> */}
      <DocContent info={node} editorRef={editorRef} />
    </Box>
    <DocAnchor
      editorRef={editorRef}
      node={node}
      summary={node?.meta?.summary || ''}
    />
    <Footer />
    <Zoom in={showScrollTop}>
      <Fab
        size="small"
        onClick={scrollToTop}
        sx={{
          backgroundColor: 'background.paper',
          color: 'text.primary',
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
};

export default Doc;
