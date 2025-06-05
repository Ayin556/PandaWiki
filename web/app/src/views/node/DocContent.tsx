'use client'

import { NodeDetail } from "@/assets/type";
import { useMobile } from "@/provider/mobile-provider";
import { Box, Divider, Stack, styled } from "@mui/material";
import { TiptapReader, UseTiptapEditorReturn } from 'ct-tiptap-editor';

const StyledDocContent = styled(Stack)(({ mobile }: { mobile: boolean }) => ({
  width: 'calc(100% - 500px)',
  marginLeft: '250px',
  wordBreak: 'break-all',
  color: 'text.primary',
  padding: `0 24px`,
  ...(mobile && {
    width: '100%',
    marginLeft: 0,
    marginTop: '160px',
    table: {
      minWidth: 'auto !important',
    },
  }),
}))

const DocContent = ({ info, editorRef }: { info: NodeDetail, editorRef: UseTiptapEditorReturn }) => {
  const { mobile = false } = useMobile()
  if (!editorRef) return null

  return <StyledDocContent mobile={mobile}>
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
  </StyledDocContent>
};

export default DocContent;