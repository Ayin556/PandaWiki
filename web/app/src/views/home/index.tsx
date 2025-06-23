"use client";

import Footer from "@/components/footer";
import { IconSearch } from "@/components/icons";
import { useKBDetail } from "@/provider/kb-provider";
import { useMobile } from "@/provider/mobile-provider";
import { Box, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NodeList from "./NodeList";
import QuestionList from "./QuestionList";

const Home = () => {
  const { mobile = false } = useMobile()
  const { kbDetail, themeMode } = useKBDetail()

  const footerSetting = kbDetail?.settings?.footer_settings
  const [footerHeight, setFooterHeight] = useState(0);

  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  // 获取 Footer 高度的函数
  const getFooterHeight = () => {
    const footerElement = document.getElementById('footer');
    if (footerElement) {
      const height = footerElement.offsetHeight;
      setFooterHeight(height);
      return height;
    }
    return 0;
  };

  useEffect(() => {
    // 延迟获取高度，确保 DOM 已渲染
    const timer = setTimeout(() => {
      getFooterHeight();
    }, 100);

    // 监听窗口大小变化，重新计算高度
    const handleResize = () => {
      getFooterHeight();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [footerSetting, mobile]);

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

  return <>
    <Box sx={{
      pt: mobile ? 13 : 18,
      minHeight: `calc(100vh - ${footerHeight + 1}px)`,
      bgcolor: themeMode === 'dark' ? 'background.default' : 'background.paper',
    }}>
      <Box sx={{
        margin: '0 auto',
        maxWidth: '1200px',
      }}>
        <Box>
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
      </Box>
    </Box>
    <Box sx={{
      bgcolor: themeMode === 'dark' ? 'background.default' : 'background.paper',
      ...(footerSetting?.footer_style === 'complex' && {
        borderTop: '1px solid',
        borderColor: 'divider',
      }),
    }}>
      <Box sx={{
        margin: '0 auto',
        maxWidth: '1200px',
      }}>
        <Footer />
      </Box>
    </Box>
  </>;
};

export default Home;
