import { KnowledgeBaseListItem } from '@/api'
import PluginLogo from '@/assets/images/plugin.png'
import Card from "@/components/Card"
import { Box, Divider, Stack, Switch } from "@mui/material"
import { Message } from 'ct-mui'
import CardRobotApi from './CardRobotApi'
import CardRobotDing from './CardRobotDing'
import CardRobotDiscord from './CardRobotDiscord'
import CardRobotFeishu from './CardRobotFeishu'
import CardRobotWebComponent from './CardRobotWebComponent'
import CardRobotWecom from './CardRobotWecom'
import CardRobotWecomService from './CardRobotWecomService'

const CardRobot = ({ kb, url }: { kb: KnowledgeBaseListItem, url: string }) => {
  const AppList = {
    2: {
      name: '网页挂件机器人',
      icon: PluginLogo,
      configDisabled: true,
    },
  }
  return <Card>
    <Box sx={{ fontWeight: 'bold', px: 2, py: 1.5, bgcolor: 'background.paper2' }}>问答机器人</Box>
    <CardRobotWebComponent kb={kb} />
    <Divider sx={{ my: 2 }} />
    <CardRobotApi kb={kb} />
    <Divider sx={{ my: 2 }} />
    <CardRobotDing kb={kb} />
    <Divider sx={{ my: 2 }} />
    <CardRobotFeishu kb={kb} />
    <Divider sx={{ my: 2 }} />
    <CardRobotWecom kb={kb} url={url} />
    <Divider sx={{ my: 2 }} />
    <CardRobotWecomService kb={kb} url={url} />
    <Divider sx={{ my: 2 }} />
    <CardRobotDiscord kb={kb} />
    <Divider sx={{ my: 2 }} />
    {Object.values(AppList).map((value, index) => <Box key={index}>
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ m: 2 }}>
        <Box sx={{ fontWeight: 'bold' }}>{value.name}</Box>
        <Switch checked={false} onChange={() => {
          Message.warning('敬请期待')
        }} />
      </Stack>
    </Box>)}
  </Card>
}

export default CardRobot
