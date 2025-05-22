import { DocItem } from "@/assets/type";
import { Box } from "@mui/material";
import { Ellipsis } from "ct-mui";
import Link from "next/link";

const Catalog = ({ documents, activeId }: { documents: DocItem[], activeId: string }) => {
  return <Box sx={{
    width: 250,
    top: 98,
    pr: 3,
    fontSize: 14,
    lineHeight: '22px',
    position: 'fixed',
  }}>
    {documents.map((item, idx) => (
      <Box key={item.id} sx={{
        color: activeId === item.id ? 'primary.main' : 'inherit',
        fontWeight: activeId === item.id ? 'bold' : 'normal',
        mb: idx === documents.length - 1 ? 0 : 2,
        '&:hover': { color: 'primary.main' }
      }}>
        <Link href={`/doc/${item.id}`}>
          <Ellipsis>
            {item.title}
          </Ellipsis>
        </Link>
      </Box>
    ))}
  </Box >
};

export default Catalog;