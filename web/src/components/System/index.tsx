import { getModelList, ModelListItem } from "@/api"
import NoData from '@/assets/images/nodata.png'
import Card from "@/components/Card"
import { Icon, Modal } from "@cx/ui"
import { Box, Button, Stack } from "@mui/material"
import { useEffect, useState } from "react"
import Member from "./component/Member"
import ModelAdd from "./component/ModelAdd"
import ModelItemCard from "./component/ModelItemCard"

const System = () => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modelList, setModelList] = useState<ModelListItem[]>([])
  const [addOpen, setAddOpen] = useState(false)

  const getModel = () => {
    setLoading(true)
    getModelList().then(res => {
      setModelList(res)
    }).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    getModel()
  }, [])

  return <>
    <Button
      size='small'
      variant='outlined'
      startIcon={<Icon type='icon-a-chilunshezhisheding' />}
      onClick={() => setOpen(true)}
    >
      系统配置
    </Button>
    <Modal
      title='系统配置'
      width={1000}
      open={open}
      footer={null}
      onCancel={() => setOpen(false)}
    >
      <Stack gap={2}>
        <Member />
        <Card sx={{
          flex: 1,
          p: 2,
          overflow: 'hidden',
          overflowY: 'auto',
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <Box sx={{ fontSize: 14, lineHeight: '24px', fontWeight: 'bold', mb: 2 }}>推理大模型</Box>
          <Button
            fullWidth
            variant='outlined'
            sx={{ height: 50, border: '1px dashed', borderColor: 'divider', mb: 2 }}
            onClick={() => {
              setAddOpen(true)
            }}
          >
            添加推理模型
          </Button>
          {modelList.length > 0 ? <Stack
            direction={'row'}
            flexWrap={'wrap'}
            alignItems={'stretch'}
            gap={2}
          >
            {modelList.map(it => <ModelItemCard key={it.id} it={it} refresh={getModel} />)}
          </Stack> : !loading ? <Stack alignItems={'center'} sx={{ my: '0px', ml: 2, fontSize: 14 }}>
            <img src={NoData} width={150} />
            <Box>暂无数据</Box>
          </Stack> : null}
        </Card>
        {/* <Card sx={{ flex: 1, p: 2, overflow: 'hidden', overflowY: 'auto' }}>
        <Box sx={{ fontSize: 14, lineHeight: '24px', fontWeight: 'bold', mb: 2 }}>Embeding 模型</Box>
        <Button
          fullWidth
          variant='outlined'
          sx={{ height: 50, border: '1px dashed', borderColor: 'divider', mb: 2 }}
          onClick={() => {
            setAddOpen(true)
          }}
        >
          添加 Embeding 模型
        </Button>
        {modelList.length > 0 ? <Stack
          direction={'row'}
          flexWrap={'wrap'}
          alignItems={'stretch'}
          gap={2}
        >
          {modelList.map(it => <ModelItemCard key={it.id} it={it} refresh={getModel} />)}
        </Stack> : !loading ? <Stack alignItems={'center'} sx={{ my: '0px', ml: 2, fontSize: 14 }}>
          <img src={NoData} width={150} />
          <Box>暂无数据</Box>
        </Stack> : null}
      </Card>
      <Card sx={{ flex: 1, p: 2, overflow: 'hidden', overflowY: 'auto', mb: 2 }}>
        <Box sx={{ fontSize: 14, lineHeight: '24px', fontWeight: 'bold', mb: 2 }}>Rerank 模型</Box>
        <Button
          fullWidth
          variant='outlined'
          sx={{ height: 50, border: '1px dashed', borderColor: 'divider', mb: 2 }}
          onClick={() => {
            setAddOpen(true)
          }}
        >
          添加 Rerank 模型
        </Button>
        {modelList.length > 0 ? <Stack
          direction={'row'}
          flexWrap={'wrap'}
          alignItems={'stretch'}
          gap={2}
        >
          {modelList.map(it => <ModelItemCard key={it.id} it={it} refresh={getModel} />)}
        </Stack> : !loading ? <Stack alignItems={'center'} sx={{ my: '0px', ml: 2, fontSize: 14 }}>
          <img src={NoData} width={150} />
          <Box>暂无数据</Box>
        </Stack> : null}
      </Card> */}
      </Stack>
    </Modal>
    <ModelAdd open={addOpen} onClose={() => setAddOpen(false)} refresh={getModel} />
  </>
}
export default System