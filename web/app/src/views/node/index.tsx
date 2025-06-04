'use client'

import { NodeDetail, NodeListItem } from "@/assets/type";
import { useKBDetail } from "@/provider/kb-provider";
import { Stack } from "@mui/material";
import { useTiptapEditor } from "ct-tiptap-editor";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Catalog from "./Catalog";
import DocAnchor from "./DocAnchor";
import DocContent from "./DocContent";

const Doc = ({ node: defaultNode, nodeList }: { node?: NodeDetail, nodeList: NodeListItem[] }) => {
  const { id: defaultId } = useParams()
  const { kb_id } = useKBDetail()
  const [id, setId] = useState(defaultId as string || '')
  const [node, setNode] = useState<NodeDetail | undefined>(defaultNode)
  const [headings, setHeadings] = useState<{ id: string, title: string, heading: number }[]>([])

  const [maxH, setMaxH] = useState(0)
  const editorRef = useTiptapEditor({
    content: node?.content || '',
    editable: false,
  })

  const getData = useCallback(async (id: string) => {
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
  }, [kb_id])

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
  }, [id, getData])

  return <Stack direction='row' alignItems={'stretch'} sx={{ mt: 12, position: 'relative', zIndex: 1 }}>
    {nodeList && <Catalog activeId={id} nodes={nodeList} onChange={setId} />}
    {node && <DocContent info={node} editorRef={editorRef} />}
    {node && <DocAnchor title={node?.name} headings={headings} maxH={maxH} />}
  </Stack>
};

export default Doc;
