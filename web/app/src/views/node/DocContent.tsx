'use client'

import { NodeDetail } from "@/assets/type";
import { Box, Divider, Stack } from "@mui/material";
import { TiptapReader, UseTiptapEditorReturn } from 'ct-tiptap-editor';

const DocContent = ({ info, editorRef }: { info: NodeDetail, editorRef: UseTiptapEditorReturn }) => {
  if (!editorRef) return null

  return <Stack sx={{
    width: 'calc(100% - 500px)',
    wordBreak: 'break-all',
    color: 'text.primary',
    ml: '250px',
    px: 3,
  }}>
    <Box sx={{
      fontSize: 32,
      lineHeight: '40px',
      fontWeight: '700',
    }}>{info?.name}</Box>
    <Divider sx={{ my: 3 }} />
    <Box sx={{
      mb: 8
    }}>
      <TiptapReader editorRef={editorRef} />
    </Box>
  </Stack>
};

export default DocContent;