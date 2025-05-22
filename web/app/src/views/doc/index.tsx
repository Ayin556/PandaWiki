import { DocInfo, DocItem } from "@/assets/type";
import { Stack } from "@mui/material";
import Catalog from "./Catalog";
import DocAnchor from "./DocAnchor";
import DocContent from "./DocContent";

interface DocProps {
  list: DocItem[]
  id: string
  info: DocInfo | null
}

const Doc = ({ list, id, info }: DocProps) => {
  return <Stack direction='row' sx={{ mt: 12, position: 'relative', zIndex: 1 }}>
    <Catalog documents={list} activeId={id} />
    <DocContent info={info} />
    <DocAnchor info={info} />
  </Stack>
};

export default Doc;
