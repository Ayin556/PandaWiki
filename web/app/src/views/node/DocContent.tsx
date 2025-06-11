'use client'

import { NodeDetail } from "@/assets/type";
import { IconClock } from "@/components/icons";
import { useMobile } from "@/provider/mobile-provider";
import { Box, Divider, Stack, styled } from "@mui/material";
import { TiptapReader, UseTiptapEditorReturn } from 'ct-tiptap-editor';
import dayjs from "dayjs";
import 'dayjs/locale/zh-cn';
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale('zh-cn')

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
      color: 'text.primary'
    }}>{info?.name}</Box>
    <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ mt: 1, color: 'text.tertiary' }}>
      <IconClock />
      <Box sx={{ fontSize: 12 }}>{dayjs(info?.updated_at).fromNow()}更新</Box>
    </Stack>
    <Divider sx={{ mb: 3, mt: 1 }} />
    <Box sx={{
      mb: 8
    }}>
      <TiptapReader editorRef={editorRef} />
    </Box>
  </StyledDocContent>
};

export default DocContent;