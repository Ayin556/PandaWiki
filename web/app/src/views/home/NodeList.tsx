import { RecommendNode } from "@/assets/type";
import { useKBDetail } from "@/provider/kb-provider";
import { useMobile } from "@/provider/mobile-provider";
import { Stack } from "@mui/material";
import NodeCard from "./NodeCard";

const NodeList = () => {
  const { mobile = false } = useMobile()
  const { kbDetail } = useKBDetail()

  return <Stack
    direction={mobile ? "column" : "row"}
    flexWrap="wrap"
    alignItems={mobile ? "center" : "stretch"}
    gap={2}
    sx={{
      mt: '60px',
      pb: 10,
      ...(mobile && {
        gap: 2,
        mt: 5,
      }),
    }}
  >
    {kbDetail?.recommend_nodes?.map((item: RecommendNode) => (
      <NodeCard key={item.id} node={item} />
    ))}
  </Stack>
};

export default NodeList;