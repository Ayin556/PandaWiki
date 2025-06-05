import { AppListItem, getAppList } from "@/api"
import AppLogo from '@/assets/images/app.png'
import DingLogo from '@/assets/images/ding.png'
import FeishuLogo from '@/assets/images/feishu.png'
import PluginLogo from '@/assets/images/plugin.png'
import WecomLogo from '@/assets/images/wecom.png'
import Avatar from "@/components/Avatar"
import Card from "@/components/Card"
import { useAppSelector } from "@/store"
import { Box, Button, Stack } from "@mui/material"
import { useEffect, useState } from "react"
import ConfigDing from "./component/ConfigDing"
import ConfigFeishu from "./component/ConfigFeishu"
import ConfigKB from "./component/ConfigKB"
import ConfigWeb from "./component/ConfigWeb"
import ConfigWecom from "./component/ConfigWecom"
import DemoApp from "./component/DemoApp"

const Application = () => {
  const { kb_id = '' } = useAppSelector(state => state.config)

  const [appList, setAppList] = useState<AppListItem[]>([])
  const [webOpen, setWebOpen] = useState(false)
  const [dingOpen, setDingOpen] = useState(false)
  const [wecomOpen, setWecomOpen] = useState(false)
  const [feishuOpen, setFeishuOpen] = useState(false)

  const AppList = {
    1: {
      name: '门户网站',
      icon: AppLogo,
      configDisabled: false,
      onClick: () => setWebOpen(true)
    },
    2: {
      name: '网页挂件',
      icon: PluginLogo,
      configDisabled: true,
      onClick: () => setWecomOpen(true)
    },
    3: {
      name: '钉钉机器人',
      icon: DingLogo,
      configDisabled: true,
      onClick: () => setDingOpen(true)
    },
    4: {
      name: '企业微信机器人',
      icon: WecomLogo,
      configDisabled: true,
      onClick: () => setWecomOpen(true)
    },
    5: {
      name: '飞书机器人',
      icon: FeishuLogo,
      configDisabled: true,
      onClick: () => setFeishuOpen(true)
    }
  }

  const getApp = () => {
    getAppList({ kb_id }).then((res) => {
      setAppList(res)
    })
  }

  useEffect(() => {
    if (kb_id) getApp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kb_id])

  return <>
    <Stack gap={2} sx={{ minHeight: 'calc(100vh - 96px)' }}>
      <ConfigKB />
      {Object.entries(AppList).map(([key, it]) => {
        return <Card sx={{ p: 2 }} key={key}>
          <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', p: '3px', boxSizing: 'border-box', border: '2px solid', borderColor: 'divider' }}>
                <Avatar src={it.icon} sx={{ width: 20, height: 20 }} />
              </Box>
              <Box>{it.name}</Box>
            </Stack>
            <Stack direction={'row'} alignItems={'center'} gap={2} >
              <Button size="small" variant="outlined" disabled={it.configDisabled} onClick={() => {
                it.onClick()
              }}>配置</Button>
            </Stack>
          </Stack>
          <DemoApp detail={null} />
        </Card>
      })}
    </Stack>
    <ConfigWeb refresh={getApp} id={appList.find(item => item.type === 1)?.id || ''} open={webOpen} onClose={() => setWebOpen(false)} />
    <ConfigDing refresh={getApp} id={appList.find(item => item.type === 3)?.id || ''} open={dingOpen} onClose={() => setDingOpen(false)} />
    <ConfigWecom refresh={getApp} id={appList.find(item => item.type === 4)?.id || ''} open={wecomOpen} onClose={() => setWecomOpen(false)} />
    <ConfigFeishu refresh={getApp} id={appList.find(item => item.type === 5)?.id || ''} open={feishuOpen} onClose={() => setFeishuOpen(false)} />
  </>
}

export default Application