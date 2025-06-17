import NavBtns from "@/components/header/NavBtns";
import PageChange from "@/components/header/PageChange";
import { IconSearch } from "@/components/icons";
import { useKBDetail } from "@/provider/kb-provider";
import { useMobile } from "@/provider/mobile-provider";
import { Box, Button, IconButton, Stack, TextField } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const DocHeader = () => {
  const { mobile } = useMobile()
  const { kbDetail } = useKBDetail()
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');

  const isDoc = pathname.includes('/node')
  const isChat = pathname.includes('/chat')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams();
      params.set('search', searchValue);
      setSearchValue('');
      router.push(`/chat?${params.toString()}`);
    }
  };

  return <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{
    position: 'fixed',
    zIndex: 10,
    top: 0,
    left: 217,
    right: 0,
    pl: 8,
    pr: 2,
    height: 50,
    bgcolor: 'background.default',
  }}>
    <Link href={'/'}>
      <Stack direction='row' alignItems='center' gap={1.5} sx={{ py: '20px', cursor: 'pointer' }} >
        {kbDetail?.settings?.icon && <img src={kbDetail?.settings?.icon} alt='logo' width={32} height={32} />}
        <Box sx={{ fontSize: 18 }}>{kbDetail?.settings?.title}</Box>
      </Stack>
    </Link>
    <Stack direction="row" alignItems="center" gap={2}>
      {pathname !== '/' && pathname !== '/chat' && (
        mobile ? <IconButton
          size='small'
          sx={{ width: 40, height: 40, color: 'text.primary' }}
        >
          <IconSearch
            sx={{ fontSize: 20 }}
            onClick={() => {
              router.push(`/chat`);
            }}
          />
        </IconButton> : <TextField
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索..."
          sx={{
            width: 300,
            height: 36,
            bgcolor: 'background.default',
            borderRadius: '10px',
            overflow: 'hidden',
            '& .MuiInputBase-input': {
              lineHeight: '19px',
              height: '19px',
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
          InputProps={{
            endAdornment: <IconSearch
              sx={{ cursor: 'pointer', color: 'text.tertiary' }}
            />
          }}
        />
      )}
      {!mobile && kbDetail?.settings?.btns?.map((item, index) => (
        <Link key={index} href={item.url} target={item.target}>
          <Button
            variant={item.variant}
            startIcon={item.showIcon && item.icon ? <img src={item.icon} alt='logo' width={24} height={24} /> : null}
            sx={{ textTransform: 'none', height: 36 }}
          >
            {item.text}
          </Button>
        </Link>
      ))}
      {mobile && <NavBtns detail={kbDetail} />}
      {!mobile && !isChat && <PageChange />}
    </Stack>
  </Stack>
}

export default DocHeader;