'use client'

import { IconSearch } from "@/components/icons"
import { useKBDetail } from "@/provider/kb-provider"
import { TextField } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react"

const DocSearch = () => {
  const router = useRouter();
  const { kbDetail, themeMode } = useKBDetail()
  const [searchText, setSearchText] = useState('')

  const handleSearch = () => {
    if (searchText.trim()) {
      sessionStorage.setItem('chat_search_query', searchText.trim());
      router.push('/chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return <TextField
    sx={{
      width: 'calc(100% - 485px)',
      marginLeft: '261px',
      borderRadius: '10px',
      mb: 3,
      px: 10,
      overflow: 'hidden',
      '& .MuiInputBase-input': {
        p: 2,
        lineHeight: '24px',
        height: '24px',
        fontFamily: 'Mono',
      },
      '& .MuiOutlinedInput-root': {
        bgcolor: themeMode === 'dark' ? 'background.paper' : 'background.default',
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
}

export default DocSearch