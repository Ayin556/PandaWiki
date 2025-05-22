import { DocItem } from "@/assets/type";
import { Stack } from "@mui/material";
import DocCard from "./DocCard";

const DocList = ({ documents }: { documents: DocItem[] }) => {
  return <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: '60px', mb: 10 }}>
    {documents.map((item: DocItem) => (
      <DocCard key={item.id} doc={item} />
    ))}
  </Stack>
};

export default DocList;