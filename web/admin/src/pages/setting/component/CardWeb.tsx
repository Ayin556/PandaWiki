import Card from "@/components/Card"
import { Box, Button, Divider, Stack } from "@mui/material"
import { Ellipsis } from "ct-mui"
import CardWebCustomCode from "./CardWebCustomCode"
import CardWebHeader from "./CardWebHeader"
import CardWebSEO from "./CardWebSEO"
import CardWebWelcome from "./CardWebWelcome"

const CardWeb = () => {
  return <Card>
    <Box sx={{ fontWeight: 'bold', m: 2 }}>前台网站</Box>
    <Divider sx={{ my: 2 }} />
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
    }}>
      <Box sx={{ fontWeight: 'bold' }}>访问方式</Box>
      <Button variant="outlined" size="small">设置</Button>
    </Stack>
    <Stack gap={2} sx={{ mx: 2 }}>
      {['http://www.panda-wiki.com', 'https://www.panda-wiki.com'].map((it) => <Ellipsis
        key={it}
        sx={{
          width: '100%',
          fontSize: 14,
          px: 3,
          fontWeight: 'bold',
          lineHeight: '52px',
          bgcolor: 'background.paper2',
          borderRadius: '10px',
          cursor: 'pointer',
          '&:hover': {
            color: 'primary.main',
          }
        }}
      >{it}</Ellipsis>)}
    </Stack>
    <Divider sx={{ my: 2 }} />
    <CardWebHeader />
    <Divider sx={{ my: 2 }} />
    <CardWebWelcome />
    <Divider sx={{ my: 2 }} />
    <CardWebSEO />
    <Divider sx={{ my: 2 }} />
    <CardWebCustomCode />
  </Card>
}
export default CardWeb