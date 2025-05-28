import { RecommendNode } from "@/assets/type";
import { useKBDetail } from "@/provider/kb-provider";
import { Stack } from "@mui/material";
import NodeCard from "./NodeCard";

const NodeList = () => {
  const { kbDetail } = useKBDetail()

  return <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: '60px', mb: 10 }}>
    {kbDetail?.recommend_nodes?.map((item: RecommendNode) => (
      <NodeCard key={item.id} node={item} />
    ))}
  </Stack>
};

export default NodeList;