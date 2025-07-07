import { Box, Stack } from "@mui/material";
import { CusTabs } from "ct-mui";
import { useState } from "react";
import AreaMap from "./AreaMap";
import ClientStat from "./ClientStat";
import HostReferer from "./HostReferer";
import HotDocs from "./HotDocs";
import QAReferer from "./QAReferer";
import RTVisitor from "./RTVisitor";
import TypeCount from "./TypeCount";

export const TimeList = [
  { label: '近 24 小时', value: 'day' },
  { label: '近 7 天', value: 'week', disabled: true },
  { label: '近 30 天', value: 'month', disabled: true },
  { label: '近 90 天', value: 'quarter', disabled: true },
]

export type ActiveTab = typeof TimeList[number]['value']

const Statistic = () => {
  const [tab, setTab] = useState<ActiveTab>('day')

  return <Box sx={{ p: 2 }}>
    <RTVisitor />
    <Box sx={{ py: 2 }}>
      <CusTabs
        list={TimeList}
        value={tab}
        change={(value: ActiveTab) => setTab(value)}
      />
    </Box>
    <TypeCount tab={tab} />
    <Stack direction={'row'} gap={2} alignItems={'stretch'} sx={{ my: 2 }}>
      <AreaMap tab={tab} />
      <QAReferer tab={tab} />
    </Stack>
    <Stack direction={'row'} gap={2} alignItems={'stretch'}>
      <HostReferer tab={tab} />
      <HotDocs tab={tab} />
      <ClientStat tab={tab} />
    </Stack>
  </Box>
}

export default Statistic;