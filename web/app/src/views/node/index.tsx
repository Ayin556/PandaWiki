'use client'

import { NodeDetail, NodeListItem } from "@/assets/type";
import { useKBDetail } from "@/provider/kb-provider";
import { Stack } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Catalog from "./Catalog";
import DocContent from "./DocContent";

const Doc = ({ node: defaultNode, nodeList }: { node?: NodeDetail, nodeList: NodeListItem[] }) => {
  const { id: defaultId } = useParams()
  const { kb_id } = useKBDetail()
  const [id, setId] = useState(defaultId as string || '')
  const [node, setNode] = useState<NodeDetail | undefined>(defaultNode)

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
    getData(id)
  }, [id])

  return <Stack direction='row' sx={{ mt: 12, position: 'relative', zIndex: 1 }}>
    {nodeList && <Catalog activeId={id} nodes={nodeList} onChange={setId} />}
    {node && <DocContent info={node} />}
    {/* {node && <DocAnchor info={node} />} */}
  </Stack>
};

export default Doc;
