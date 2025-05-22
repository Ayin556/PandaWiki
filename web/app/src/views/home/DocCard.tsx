import { DocItem } from "@/assets/type";
import { StyledCard } from "@/components/StyledHTML";
import { Box, Stack } from "@mui/material";
import Link from "next/link";

const DocCard = ({ doc }: { doc: DocItem }) => {
  return <StyledCard sx={{ width: 'calc((100% - 32px) / 3)', cursor: 'pointer' }}>
    <Link href={`/doc/${doc.id}`}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ fontSize: '18px', fontWeight: '700', lineHeight: '26px' }}>{doc.title}</Box>
      </Stack>
      <Box sx={{ color: 'text.secondary', fontSize: 14 }}>{doc.summary}</Box>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Box sx={{ color: 'primary.main', fontSize: 14 }}>
          查看更多
        </Box>
      </Stack>
    </Link>
  </StyledCard>
};

export default DocCard;