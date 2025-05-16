import { AppConfigEditData } from '@/api';
import ChatLogo from '@/assets/images/chat-logo.png';
import Avatar from "@/components/Avatar";
import Card from "@/components/Card";
import { addOpacityToColor } from "@/utils";
import { Icon } from "@cx/ui";
import { Box, Stack, TextField, useTheme } from "@mui/material";

const DemoApp = ({ detail }: { detail: AppConfigEditData | null }) => {
  const theme = useTheme()

  if (!detail) return null

  return <Box sx={{ fontSize: 14, overflow: 'auto', m: 1, p: 1, pb: 0, mb: 0, height: 'calc(100vh - 173.13px)' }}>
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{
        width: '100%',
        pt: '64px',
        m: 'auto',
        color: '#000000',
        position: 'relative',
        transition: 'all 0.5s',
      }}>
        <Stack direction={'column'} alignItems={'center'} gap={1.5} sx={{ transition: 'all 0.5s' }}>
          <Box sx={{
            transition: 'all 0.5s',
            textAlign: 'center',
            height: 48,
          }}>
            <Avatar
              sx={{ width: 48, height: 48, display: 'inline-block' }}
              src={detail.icon}
              errorImg={<img src={ChatLogo} style={{ width: '100%', height: '100%' }} />}
            />
          </Box>
          <Box sx={{
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 'bold',
            mb: 2,
          }}>
            <Box component='span'>欢迎使用</Box>
            <Box component='span' sx={{
              background: 'linear-gradient(90deg, #0063FF 0%, #3F00FF 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{detail.name}</Box>
          </Box>
        </Stack>
        {detail.desc && <Box sx={{
          fontSize: '12px',
          lineHeight: '20px',
          color: 'text.auxiliary',
          textAlign: 'center',
        }}>{detail.desc}</Box>}
        <Box sx={{
          width: '90%',
          height: 143,
          p: 2,
          pr: 6,
          mt: 4,
          mx: 'auto',
          borderRadius: '20px',
          boxShadow: '0px 4px 8px 4px rgba(54,59,76,0.03)',
          position: 'relative',
          bgcolor: 'background.paper',
        }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            sx={{
              '.MuiInputBase-root': {
                bgcolor: 'background.paper',
                height: '111px',
                p: 0
              },
              textarea: {
                lineHeight: '26px',
                height: '111px !important',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              },
              fieldset: {
                border: 'none',
              }
            }}
            size="small"
            value={''}
            placeholder={detail.search_placeholder}
            autoComplete="off"
          />
          <Box sx={{
            bgcolor: 'background.paper2',
            borderRadius: '50%',
            position: 'absolute',
            right: 10,
            bottom: 10,
            p: 1,
            cursor: 'pointer',
            ':hover': {
              bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1)
            }
          }}>
            <Icon type='icon-shangjiantou' sx={{ fontSize: 12 }} />
          </Box>
        </Box>
        <Stack direction={'row'} justifyContent={'center'} gap={2} flexWrap={'wrap'} sx={{ mt: 2 }}>
          {(detail.recommend_questions || []).map(item => (
            <Box key={item} sx={{
              cursor: 'pointer',
              fontSize: '12px',
              lineHeight: '20px',
              height: 32,
              border: `1px solid`,
              borderColor: 'divider',
              borderRadius: '16px',
              py: 0.75,
              px: 1.5,
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1)
              }
            }}>
              {item}
            </Box>
          ))}
        </Stack>
      </Box >
    </Card>
  </Box>
}

export default DemoApp