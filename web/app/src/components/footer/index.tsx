import logo from '@/assets/images/logo.png';
import { useKBDetail } from '@/provider/kb-provider';
import { useMobile } from '@/provider/mobile-provider';
import { Box, Divider, Stack } from "@mui/material";
import Image from "next/image";
import Link from 'next/link';

const Footer = ({ showBrand = true }: { showBrand?: boolean }) => {
  const { kbDetail } = useKBDetail()
  const { mobile = false } = useMobile()
  const footerSetting = kbDetail?.settings?.footer_settings

  if (mobile) return <Box id='footer' sx={{
    position: 'relative',
    fontSize: '12px',
    fontWeight: 'normal',
    zIndex: 1,
    mx: 3,
  }}>
    {footerSetting?.footer_style === 'complex' && showBrand && <Box sx={{ py: 5 }}>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2} sx={{ mb: 5 }}>
        {footerSetting?.brand_groups?.map((group, idx) => (
          <Stack gap={2} key={group.name} sx={{
            fontSize: 14,
            lineHeight: '22px',
            width: 'calc(50% - 8px)',
            ...(idx > 1 && {
              mt: 3,
            }),
            '& a:hover': {
              color: 'primary.main',
            }
          }}>
            <Box sx={{ fontWeight: 'bold', fontSize: 18, lineHeight: '24px', mb: 1 }}>{group.name}</Box>
            {group.links?.map((link) => (
              <Link href={link.url} target='_blank' key={link.name}>{link.name}</Link>
            ))}
          </Stack>
        ))}
      </Stack>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        {footerSetting?.brand_logo && <img src={footerSetting.brand_logo} alt="PandaWiki" width={24} height={24} />}
        <Box sx={{ fontWeight: 'bold', lineHeight: '32px', fontSize: 24 }}>{footerSetting?.brand_name}</Box>
      </Stack>
      {footerSetting?.brand_desc && <Box sx={{ fontSize: 12, color: 'text.secondary', lineHeight: '26px', ml: footerSetting?.brand_logo ? 4 : 0, mt: 2 }}>
        {footerSetting.brand_desc}
      </Box>}
    </Box>}
    {!!footerSetting?.corp_name && <Box sx={{ height: 40, lineHeight: '40px', color: 'text.tertiary' }}>
      © 2025 {footerSetting?.corp_name} 版权所有
    </Box>}
    {!!footerSetting?.icp && <Box sx={{ height: 40, lineHeight: '40px', color: 'text.tertiary' }}>
      {footerSetting?.icp}
    </Box>}
    <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ height: 40, lineHeight: '40px' }}>
      本网站由
      <Link href={'https://pandawiki.docs.baizhi.cloud/'} target='_blank'>
        <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{
          cursor: 'pointer',
          '&:hover': {
            color: 'primary.main',
          }
        }}>
          <Image src={logo.src} alt="PandaWiki" width={16} height={16} />
          <Box sx={{ fontWeight: 'bold' }}>PandaWiki</Box>
        </Stack>
      </Link>
      提供技术支持
    </Stack>
  </Box>

  return <Box id='footer' sx={{
    position: 'relative',
    fontSize: '12px',
    fontWeight: 'normal',
    zIndex: 1,
  }}>
    {footerSetting?.footer_style === 'complex' && showBrand && <Box sx={{ py: 6 }}>
      <Stack direction={'row'} justifyContent={'space-between'} gap={10}>
        <Box sx={{ width: '30%', minWidth: 200 }}>
          {footerSetting?.brand_name && <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ mb: 2 }}>
            {footerSetting?.brand_logo && <img src={footerSetting.brand_logo} alt="PandaWiki" width={24} height={24} />}
            <Box sx={{ fontWeight: 'bold', lineHeight: '32px', fontSize: 24 }}>{footerSetting?.brand_name}</Box>
          </Stack>}
          {footerSetting?.brand_desc && <Box sx={{ fontSize: 12, color: 'text.secondary', lineHeight: '26px' }}>
            {footerSetting.brand_desc}
          </Box>}
        </Box>
        <Stack direction={'row'} justifyContent={'flex-end'}>
          {footerSetting?.brand_groups?.map((group) => (
            <Stack gap={2} key={group.name} sx={{
              fontSize: 14,
              lineHeight: '22px',
              width: 240,
              '& a:hover': {
                color: 'primary.main',
              }
            }}>
              <Box sx={{ fontWeight: 'bold', fontSize: 18, lineHeight: '24px', mb: 1 }}>{group.name}</Box>
              {group.links?.map((link) => (
                <Link href={link.url} target='_blank' key={link.name}>{link.name}</Link>
              ))}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>}
    <Box sx={{
      height: 40,
      lineHeight: '40px',
      textAlign: 'center',
    }}>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
        <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ color: 'text.tertiary' }}>
          {!!footerSetting?.corp_name && <Box>© 2025 {footerSetting?.corp_name} 版权所有</Box>}
          {!!footerSetting?.corp_name && !!footerSetting?.icp && !mobile && <Divider orientation='vertical' sx={{ mx: 0.5, height: 16 }} />}
          {!!footerSetting?.icp && <Link href={`https://beian.miit.gov.cn/`} target='_blank'>{footerSetting?.icp}</Link>}
        </Stack>
        <Stack direction={'row'} alignItems={'center'} gap={0.5}>
          本网站由
          <Link href={'https://pandawiki.docs.baizhi.cloud/'} target='_blank'>
            <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.main',
              }
            }}>
              <Image src={logo.src} alt="PandaWiki" width={16} height={16} />
              <Box sx={{ fontWeight: 'bold' }}>PandaWiki</Box>
            </Stack>
          </Link>
          提供技术支持
        </Stack>
      </Stack>
    </Box>
  </Box>
}

export default Footer