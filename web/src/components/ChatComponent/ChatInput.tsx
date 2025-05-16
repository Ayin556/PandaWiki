import { AppDetail } from "@/api";
import { AnswerStatus } from "@/constant/enums";
import { addOpacityToColor } from "@/utils";
import { Box, TextField, useTheme } from "@mui/material";
import { Icon } from "ct-mui";
import { useEffect, useState } from "react";
import ChatLoading from "./ChatLoading";

interface ChatInputProps {
  pc: boolean;
  text: string;
  setText: (text: string) => void;
  first: boolean;
  thinking: keyof typeof AnswerStatus;
  loading: boolean;
  onSearch: (text: string) => void;
  handleSearchAbort: () => void;
  setThinking: (thinking: keyof typeof AnswerStatus) => void;
  detail?: AppDetail;
}

const ChatInput = ({
  first,
  thinking,
  loading,
  onSearch,
  handleSearchAbort,
  setThinking,
  detail,
  pc = false,
  text,
  setText
}: ChatInputProps) => {
  const theme = useTheme();

  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    const header = document.getElementById(`${pc ? 'pc' : 'h5'}-chat-header`)
    if (header) {
      const paddingHeight = pc ? 106 : 80
      setHeaderHeight(header.clientHeight + paddingHeight + 16)
    }
  }, [detail, pc])

  return (
    <Box sx={{
      p: 2,
      borderRadius: '10px',
      boxShadow: '0px 4px 8px 4px rgba(54,59,76,0.06)',
      position: first ? 'absolute' : 'fixed',
      top: first ? headerHeight : undefined,
      bottom: first ? undefined : 40,
      left: '50%',
      transform: 'translateX(-50%)',
      bgcolor: 'background.paper',
      width: pc ? 760 : 'calc(100% - 32px)',
    }}>
      <TextField
        fullWidth
        multiline
        rows={pc ? 4 : 2}
        sx={{
          '.MuiInputBase-root': {
            bgcolor: 'background.paper',
            p: 0,
            overflow: 'hidden',
            height: (!first || !pc) ? '52px !important' : '104px !important',
            transition: 'all 0.5s ease-in-out',
          },
          textarea: {
            lineHeight: '26px',
            height: (!first || !pc) ? '52px !important' : '104px !important',
            borderRadius: 0,
            transition: 'all 0.5s ease-in-out',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
          fieldset: {
            border: 'none',
          }
        }}
        size="small"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          const isComposing = e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229;
          if (e.key === 'Enter' && !e.shiftKey && !loading && text.length > 0 && !isComposing) {
            e.preventDefault();
            handleSearchAbort()
            onSearch(text)
          }
        }}
        placeholder={detail?.settings.search_placeholder || '请输入问题'}
        autoComplete="off"
        slotProps={{
          input: {
            sx: {
              gap: 2,
              alignItems: loading ? 'flex-start' : 'flex-end',
              mr: loading ? 10 : 4,
            },
            endAdornment: <Box sx={{
              fontSize: 12,
              flexShrink: 0,
              cursor: 'pointer',
            }}>
              {loading ? <ChatLoading loading={loading} thinking={thinking} onClick={() => {
                setThinking(4)
                handleSearchAbort()
              }} /> : <Box sx={{
                bgcolor: 'background.paper2',
                borderRadius: '50%',
                p: 1,
                ':hover': {
                  bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1)
                }
              }} onClick={() => {
                if (text.length > 0) {
                  handleSearchAbort()
                  setThinking(1)
                  onSearch(text)
                }
              }}>
                <Icon type='icon-shangjiantou' sx={{ fontSize: 12 }} />
              </Box>}
            </Box>
          }
        }}
      />
    </Box>
  )
}

export default ChatInput;