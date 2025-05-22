"use client";
import { DocItem } from "@/assets/type";
import { IconSearch } from "@/components/icons";
import { Box, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DocList from "./DocList";

const Home = ({ documents }: { documents: DocItem[] }) => {
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
      PandaWiki 知识库
    </Box>
    <Box sx={{ width: '760px', mx: 'auto', mt: 5 }}>
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
        placeholder="开始搜索"
        autoComplete="off"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
        InputProps={{
          endAdornment: <IconSearch
            sx={{ cursor: 'pointer', color: 'text.auxiliary' }}
            onClick={handleSearch}
          />
        }}
      />
    </Box>
    <DocList documents={documents} />
  </Box>;
};

export default Home;
