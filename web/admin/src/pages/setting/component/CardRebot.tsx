import { KnowledgeBaseListItem } from '@/api'
import FeishuLogo from '@/assets/images/feishu.png'
import PluginLogo from '@/assets/images/plugin.png'
import WecomLogo from '@/assets/images/wecom.png'
import Card from "@/components/Card"
import { Box, Divider, Stack, Switch } from "@mui/material"
import { Message } from 'ct-mui'
import CardRebotApi from './CardRebotApi'
import CardRebotDing from './CardRebotDing'

const CardRebot = ({ kb }: { kb: KnowledgeBaseListItem }) => {
  const AppList = {
    2: {
      name: '网页挂件机器人',
      icon: PluginLogo,
      configDisabled: true,
    },
    4: {
      name: '企业微信机器人',
      icon: WecomLogo,
      configDisabled: true,
    },
    5: {
      name: '飞书机器人',
      icon: FeishuLogo,
      configDisabled: true,
    }
  }
  return <Card>
    <Box sx={{ fontWeight: 'bold', px: 2, py: 1.5, bgcolor: 'background.paper2' }}>问答机器人</Box>
    <CardRebotApi kb={kb} />
    <Divider sx={{ my: 2 }} />
    <CardRebotDing kb={kb} />
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

export default CardRebot