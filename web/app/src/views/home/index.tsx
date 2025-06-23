"use client";

import Footer from "@/components/footer";
import { IconSearch } from "@/components/icons";
import { useKBDetail } from "@/provider/kb-provider";
import { useMobile } from "@/provider/mobile-provider";
import { Box, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NodeList from "./NodeList";
import QuestionList from "./QuestionList";

const Home = () => {
  const { mobile = false } = useMobile()
  const { kbDetail, themeMode } = useKBDetail()

  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (searchText.trim()) {
      sessionStorage.setItem('chat_search_query', searchText.trim());
      router.push('/chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return <Box sx={{
    pt: mobile ? 13 : 18,
    minHeight: '100vh',
    bgcolor: themeMode === 'dark' ? 'background.default' : 'background.paper',
  }}>
    <Box sx={{
      margin: '0 auto',
      maxWidth: '1200px',
    }}>
      <Box sx={{
        minHeight: mobile ? 'calc(100vh - 144px)' : 'calc(100vh - 184px)',
      }}>
        <Box sx={{
          color: 'text.primary',
          fontSize: '40px',
          textAlign: 'center',
          fontWeight: '700',
          lineHeight: '44px',
          ...(mobile && {
            fontSize: '32px',
            lineHeight: '40px',
          }),
        }}>
          {kbDetail?.settings?.welcome_str}
        </Box>
        <Box sx={{
          width: '656px',
          margin: '40px auto 0',
          ...(mobile && {
            width: 'calc(100% - 48px)',
          }),
        }}>
          <TextField
            fullWidth
            sx={{
              width: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              '& .MuiInputBase-input': {
                p: 2,
                lineHeight: '24px',
                height: '24px',
                fontFamily: 'Mono',
              },
              '& .MuiOutlinedInput-root': {
                pr: '18px',
                bgcolor: themeMode === 'dark' ? 'background.paper' : 'background.default',
                '& fieldset': {
                  borderRadius: '10px',
                  borderColor: 'divider',
                  px: 2,
                },
              }
            }}
            placeholder={kbDetail?.settings?.search_placeholder || "开始搜索"}
            autoComplete="off"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              endAdornment: <IconSearch
                sx={{ cursor: 'pointer', color: 'text.tertiary' }}
                onClick={handleSearch}
              />
            }}
          />
        </Box>
        {!mobile && <QuestionList />}
        <NodeList />
      </Box>
      <Footer />
    </Box>
  </Box>;
};

export default Home;
