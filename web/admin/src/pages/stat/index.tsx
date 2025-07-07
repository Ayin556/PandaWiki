import Card from "@/components/Card";
import { useURLSearchParams } from "@/hooks";
import { Box } from "@mui/material";
import { CusTabs } from "ct-mui";
import Conversation from "./conversation";
import Statistic from "./Statistic";

const list = [
  { label: '访问统计', value: 'stat' },
  { label: '对话记录', value: 'conversation' }
]

type ActiveTab = 'stat' | 'conversation';

const Stat = () => {
  const [searchParams, setSearchParams] = useURLSearchParams()
  const tab = searchParams.get('tab') || 'stat' as ActiveTab;

  console.log(tab)

  return <Card>
    <Box sx={{ p: 2, pb: 0 }}>
      <CusTabs
        list={list}
        value={tab}
        change={(value: ActiveTab) => {
          setSearchParams({ tab: value })
        }}
      />
    </Box>
    {tab === 'stat' ? <Statistic /> : <Conversation />}
  </Card>
};

export default Stat;