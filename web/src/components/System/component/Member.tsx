import { getUserList, UserInfo } from '@/api'
import NoData from '@/assets/images/nodata.png'
import Card from "@/components/Card"
import { tableSx } from "@/constant/styles"
import { useAppSelector } from '@/store'
import { Table } from "@cx/ui"
import { Box, Button, Stack } from "@mui/material"
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import MemberAdd from './MemberAdd'
import MemberUpdate from './MemberUpdate'

const Member = () => {
  const { user } = useAppSelector(state => state.config)
  const [loading, setLoading] = useState(false)
  const [userList, setUserList] = useState<UserInfo[]>([])
  const [curUser, setCurUser] = useState<UserInfo | null>(null)
  const columns = [
    {
      title: '用户名',
      dataIndex: 'account',
      render: (text: string, record: UserInfo) => <Stack direction={'row'} alignItems={'center'} gap={2}>
        {text}
        {user?.id === record.id ? <Box sx={{
          borderColor: 'text.primary',
          border: '1px solid',
          p: '0 8px',
          borderRadius: '10px',
          fontSize: '12px',
          lineHeight: '18px',
        }}>我</Box> : null}
      </Stack>
    },
    {
      title: '上次使用时间',
      dataIndex: 'last_access',
      render: (text: string) => <Box>{text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'}</Box>
    },
    {
      title: '',
      dataIndex: 'action',
      width: 120,
      render: (_: string, record: UserInfo) => <Button onClick={() => setCurUser(record)}>
        {user?.id === record.id ? '修改密码' : '重置密码'}
      </Button>
    }
  ]

  const getData = () => {
    setLoading(true)
    getUserList().then(res => {
      const idx = res.findIndex(item => item.id === user?.id)
      if (idx !== -1) {
        setUserList([res[idx], ...res.slice(0, idx), ...res.slice(idx + 1)])
      } else {
        setUserList(res)
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Card sx={{
    flex: 1,
    py: 2,
    overflow: 'hidden',
    overflowY: 'auto',
    border: '1px solid',
    borderColor: 'divider',
  }}>
    <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} sx={{ mb: 2, px: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '24px', fontWeight: 'bold' }}>用户管理</Box>
      <MemberAdd refresh={getData} />
    </Stack>
    <Table
      columns={columns}
      dataSource={userList}
      rowKey="id"
      size='small'
      height='300px'
      updateScrollTop={false}
      sx={{ overflow: 'hidden', ...tableSx }}
      pagination={false}
      renderEmpty={loading ? <Box></Box> : <Stack alignItems={'center'}>
        <img src={NoData} width={150} />
        <Box>暂无数据</Box>
      </Stack>}
    />
    {curUser && <MemberUpdate user={curUser} refresh={getData} type={user?.id === curUser.id ? 'update' : 'reset'} />}
  </Card>
}

export default Member