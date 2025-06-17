'use client'

import { NodeDetail } from "@/assets/type";
import { IconClock } from "@/components/icons";
import { useMobile } from "@/provider/mobile-provider";
import { Box, Stack } from "@mui/material";
import { TiptapReader, UseTiptapEditorReturn } from 'ct-tiptap-editor';
import dayjs from "dayjs";
import 'dayjs/locale/zh-cn';
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale('zh-cn')

const DocContent = ({ info, editorRef }: { info?: NodeDetail, editorRef: UseTiptapEditorReturn }) => {
  const { mobile = false } = useMobile()
  if (!editorRef || !info) return null

  return <Box sx={{
    width: 'calc(100% - 500px)',
    marginLeft: '250px',
    wordBreak: 'break-all',
    color: 'text.primary',
    padding: `0 24px`,
    position: 'relative',
    zIndex: 1,
    ...(mobile && {
      width: '100%',
      marginLeft: 0,
      marginTop: '160px',
      table: {
        minWidth: 'auto !important',
      },
    }),
  }}>
    <Stack direction={mobile ? 'column' : 'row'} alignItems={mobile ? 'flex-start' : 'center'} justifyContent='space-between' sx={{
      bgcolor: 'background.paper',
      p: 3,
      borderRadius: '10px',
      border: '1px solid',
      borderColor: 'divider',
    }}>
      <Box sx={{ fontSize: 32, lineHeight: '40px', fontWeight: '700', color: 'text.primary' }}>
        {info?.name}
      </Box>
      <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ color: 'text.tertiary' }}>
        <IconClock />
        <Box sx={{ fontSize: 12 }}>{dayjs(info?.updated_at).fromNow()}更新</Box>
      </Stack>
    </Stack>
    <Box sx={{ mt: 3 }}>
      <TiptapReader editorRef={editorRef} />
    </Box>
  </Box>
};

export default DocContent;