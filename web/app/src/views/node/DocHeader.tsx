import Logo from '@/assets/images/logo.png';
import NavBtns from "@/components/header/NavBtns";
import PageChange from "@/components/header/PageChange";
import { IconSearch } from "@/components/icons";
import { useKBDetail } from "@/provider/kb-provider";
import { useMobile } from "@/provider/mobile-provider";
import { Box, Button, IconButton, Stack } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const DocHeader = () => {
  const { mobile } = useMobile()
  const { kbDetail } = useKBDetail()
  const router = useRouter();
  const pathname = usePathname();

  const modeSwitchVisible = kbDetail?.settings?.mode_switch_visible !== 2
  const isChat = pathname.includes('/chat')

  return <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{
    position: 'fixed',
    zIndex: 10,
    top: 0,
    left: 261,
    right: 0,
    pl: 10,
    pr: 15,
    height: 64,
    bgcolor: 'background.default',
    borderBottom: '1px solid',
    borderColor: 'divider',
  }}>
    <Link href={'/'}>
      <Stack direction='row' alignItems='center' gap={1.5} sx={{ py: '20px', cursor: 'pointer', color: 'text.primary', '&:hover': { color: 'primary.main' } }} >
        {kbDetail?.settings?.icon ? <img src={kbDetail?.settings?.icon} alt='logo' width={32} height={32} />
          : <Image src={Logo.src} width={32} height={32} alt='logo' />}
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
        </IconButton> : null)}
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
      {!mobile && !isChat && modeSwitchVisible && <PageChange />}
    </Stack>
  </Stack>
}

export default DocHeader;