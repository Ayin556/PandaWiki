"use client";

import { IconSearch } from "@/components/icons";
import { useKBDetail } from "@/provider/kb-provider";
import { Box, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NodeList from "./NodeList";
import QuestionList from "./QuestionList";

const Home = () => {
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

  return <Box sx={{ pt: 10 }}>
    <Box sx={{ fontSize: '40px', textAlign: 'center', fontWeight: '700', lineHeight: '44px' }}>
      {kbDetail?.settings?.welcome_str}
    </Box>
    <Box sx={{ width: '656px', mx: 'auto', mt: 5 }}>
      <TextField
        fullWidth
        sx={{
          width: '656px',
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
    </Box>
    <QuestionList />
    <NodeList />
  </Box>;
};

export default Home;
