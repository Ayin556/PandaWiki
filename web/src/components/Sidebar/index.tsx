import Logo from '@/assets/images/logo.png';
import Qrcode from '@/assets/images/qrcode.png';
import { Icon } from '@cx/ui';
import { Box, Button, Stack, Tooltip, useTheme } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import Avatar from '../Avatar';
import Version from './Version';

const menus = [
  {
    label: '文档',
    value: '/',
    pathname: 'document',
    icon: 'icon-neirongguanli',
    show: true,
  },
  {
    label: '分析',
    value: '/conversation',
    pathname: 'conversation-history',
    icon: 'icon-fenxi',
    show: true,
  },
  {
    label: '设置',
    value: '/setting',
    pathname: 'application-setting',
    icon: 'icon-aiyingyong1',
    show: true,
  },
]

const Sidebar = () => {
  const { pathname } = useLocation()
  const theme = useTheme()
  return <Stack sx={{
    width: 138,
    m: 2,
    zIndex: 999,
    p: 2,
    height: 'calc(100vh - 32px)',
    bgcolor: '#FFFFFF',
    borderRadius: '10px',
    position: 'fixed',
    top: 0,
    left: 0,
  }}>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} sx={{ flexShrink: 0 }}>
      <Avatar src={Logo} sx={{ width: 30, height: 30 }} />
    </Stack>
    <Box sx={{
      fontSize: '16px', fontWeight: 'bold', color: 'text.primary', textAlign: 'center', lineHeight: '36px',
      borderBottom: `1px solid ${theme.palette.divider}`,
    }}>PandaWiki</Box>
    <Stack sx={{ pt: 2, flexGrow: 1 }} gap={1}>
      {menus.map(it => {
        let isActive = false
        if (it.value === '/') {
          isActive = pathname === '/'
        } else {
          isActive = pathname.includes(it.value)
        }
        if (!it.show) return null
        return <NavLink key={it.pathname} to={it.value} style={{
          zIndex: isActive ? 2 : 1,
          color: isActive ? '#FFFFFF' : 'text.primary',
        }}>
          <Button variant={isActive ? 'contained' : 'text'} sx={{
            width: '100%',
            height: 50,
            justifyContent: 'flex-start',
            color: isActive ? '#FFFFFF' : 'text.primary',
            fontWeight: isActive ? '500' : '400',
            boxShadow: isActive ? '0px 10px 25px 0px rgba(33,34,45,0.2)' : 'none',
            ':hover': {
              boxShadow: isActive ? '0px 10px 25px 0px rgba(33,34,45,0.2)' : 'none',
            }
          }} startIcon={<Icon type={it.icon} sx={{
            fontSize: 14,
            color: isActive ? '#FFFFFF' : 'text.disabled',
          }} />}>
            {it.label}
          </Button>
        </NavLink>
      })}
    </Stack>
    <Stack gap={1} sx={{ flexShrink: 0 }}>
      <Button variant='outlined' sx={{
        fontSize: 14,
        flexShrink: 0,
        bgcolor: 'background.paper',
        pr: 1.5,
        pl: 1.5,
        gap: 0.5,
        justifyContent: 'flex-start',
        border: `1px solid ${theme.palette.divider}`,
        '.MuiButton-startIcon': {
          mr: '3px',
        },
        '&:hover': {
          color: 'primary.main',
        }
      }} startIcon={<Icon type='icon-a-Webyingyong' />}
        onClick={() => window.open('https://docs.web2gpt.ai/', '_blank')}
      >官方网站</Button>
      <Button variant='outlined' sx={{
        fontSize: 14,
        flexShrink: 0,
        bgcolor: 'background.paper',
        pr: 1.5,
        pl: 1.5,
        gap: 0.5,
        justifyContent: 'flex-start',
        border: `1px solid ${theme.palette.divider}`,
        '.MuiButton-startIcon': {
          mr: '3px',
        },
        '&:hover': {
          color: 'primary.main',
        }
      }} startIcon={<Icon type='icon-bangzhuwendang1' />}
        onClick={() => window.open('https://docs.web2gpt.ai/', '_blank')}
      >帮助文档</Button>
      <Tooltip
        placement='bottom-start'
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: 'background.paper',
              boxShadow: '0px 4px 8px 4px rgba(54,59,76,0.06)',
              maxWidth: 400,
              borderRadius: '10px',
            },
          },
          arrow: { sx: { color: 'background.paper' } },
        }}
        title={
          <Box sx={{ p: '16px 8px', width: 192 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box component='img' src={Qrcode} sx={{ width: '100%' }} />
              <Box sx={{ fontSize: '14px', mt: '8px', color: 'text.primary' }}>交流群</Box>
            </Box>
          </Box>
        }
        arrow
      >
        <Button variant='outlined' sx={{
          fontSize: 14,
          flexShrink: 0,
          bgcolor: 'background.paper',
          pr: 1.5,
          pl: 1.5,
          gap: 0.5,
          justifyContent: 'flex-start',
          border: `1px solid ${theme.palette.divider}`,
          '.MuiButton-startIcon': {
            mr: '3px',
          },
          '&:hover': {
            color: 'primary.main',
          }
        }} startIcon={<Icon type='icon-group' />}>交流群</Button>
      </Tooltip>
      <Version />
    </Stack>
  </Stack>
}

export default Sidebar