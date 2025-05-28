'use client'
import { NodeDetail } from "@/assets/type";
import { Box, Divider, Stack } from "@mui/material";
import { TiptapReader } from 'ct-tiptap-editor';

const DocContent = ({ info }: { info: NodeDetail }) => {
  return <Stack sx={{ width: 'calc(100% - 500px)', ml: '300px', mr: '200px', wordBreak: 'break-all', color: 'text.primary' }}>
    <Box sx={{
      fontSize: 32,
      lineHeight: '40px',
      fontWeight: '700',
    }}>{info?.name}</Box>
    <Divider sx={{ my: 3 }} />
    <Box sx={{
      mb: 8
    }}>
      <TiptapReader content={info?.content || ''} />
    </Box>
  </Stack>
};

export default DocContent;