"use client";

import { IconSearch } from "@/components/icons";
import { useKBDetail } from "@/provider/kb-provider";
import { useMobile } from "@/provider/mobile-provider";
import { Box, styled, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NodeList from "./NodeList";
import QuestionList from "./QuestionList";

const StyledWelcomeStr = styled(Box)(({ mobile }: { mobile: boolean }) => ({
  fontSize: '40px',
  textAlign: 'center',
  fontWeight: '700',
  lineHeight: '44px',
  ...(mobile && {
    fontSize: '32px',
    lineHeight: '40px',
  }),
}))

const StyledSearch = styled(Box)(({ mobile }: { mobile: boolean }) => ({
  width: '656px',
  margin: '40px auto 0',
  ...(mobile && {
    width: 'calc(100% - 48px)',
  }),
}))

const Home = () => {
  const { mobile = false } = useMobile()
  const { kbDetail } = useKBDetail()

  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (searchText.trim()) {
      router.push(`/chat?search=${encodeURIComponent(searchText.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return <Box sx={{ pt: mobile ? 13 : 18, minHeight: 'calc(100vh - 40px)' }}>
    <StyledWelcomeStr mobile={mobile} sx={{ color: 'text.primary' }}>
      {kbDetail?.settings?.welcome_str}
    </StyledWelcomeStr>
    <StyledSearch mobile={mobile}>
      <TextField
        fullWidth
        sx={{
          width: '100%',
          bgcolor: 'background.default',
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
    </StyledSearch>
    {!mobile && <QuestionList />}
    <NodeList />
  </Box>;
};

export default Home;
