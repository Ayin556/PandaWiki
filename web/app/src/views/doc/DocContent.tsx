'use client'
import { DocInfo } from "@/assets/type";
import { Box, Divider, Stack } from "@mui/material";
import { TiptapReader } from 'ct-tiptap-editor';

const DocContent = ({ info }: { info: DocInfo | null }) => {
  return <Stack sx={{ width: 'calc(100% - 500px)', mx: '250px', wordBreak: 'break-all' }}>
    <Box sx={{
      fontSize: 32,
      lineHeight: '40px',
      fontWeight: '700',
    }}>{info?.meta.title}</Box>
    <Divider sx={{ my: 3 }} />
    <Box sx={{
      mb: 8
    }}>
      <TiptapReader content={info?.content || ''} />
    </Box>
  </Stack>
};

export default DocContent;