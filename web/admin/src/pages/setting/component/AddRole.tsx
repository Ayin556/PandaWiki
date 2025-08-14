import { Box, Tooltip, Stack, Select, MenuItem, Radio } from '@mui/material';
import { getApiV1UserList } from '@/request/User';
import { postApiV1KnowledgeBaseUserInvite } from '@/request/KnowledgeBase';
import { ConstsUserKBPermission, V1UserListItemResp } from '@/request/types';
import { FormItem } from '@/components/Form';
import NoData from '@/assets/images/nodata.png';
import Card from '@/components/Card';
import { Message, Modal, Table } from 'ct-mui';
import InfoIcon from '@mui/icons-material/Info';
import dayjs from 'dayjs';
import { ColumnType } from 'ct-mui/dist/Table';
import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store';

interface AddRoleProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  selectedIds: string[];
}

const AddRole = ({ open, onCancel, onOk, selectedIds }: AddRoleProps) => {
  const { kb_id, license } = useAppSelector(state => state.config);
  const [list, setList] = useState<V1UserListItemResp[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<V1UserListItemResp | null>(
    null,
  );
  const [perm, setPerm] = useState<ConstsUserKBPermission>(
    ConstsUserKBPermission.UserKBPermissionFullControl,
  );

  const isEnterprise = useMemo(() => {
    return license.edition === 2;
  }, [license]);

  const columns: ColumnType<V1UserListItemResp>[] = [
    {
      title: '',
      dataIndex: 'id',
      width: 80,
      render: (text: string, record) => (
        <Tooltip
          arrow
          placement='top'
          title={selectedIds.includes(text) ? '已添加' : ''}
        >
          <span>
            <Radio
              disableRipple
              size='small'
              disabled={selectedIds.includes(text)}
              checked={selectedRowKeys === text}
              onChange={() => {
                setSelectedRowKeys(text);
                setSelectedUser(record);
              }}
              sx={{
                '.MuiTouchRipple-root': {
                  display: 'none',
                },
              }}
            />
          </span>
        </Tooltip>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'account',
      render: (text: string) => (
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          {text}
        </Stack>
      ),
    },
    {
      title: '上次使用时间',
      dataIndex: 'last_access',
      render: (text: string) => (
        <Box>{text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'}</Box>
      ),
    },
  ];
  const getData = () => {
    setLoading(true);
    getApiV1UserList()
      .then(res => {
        setList(res.users || []);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = () => {
    if (!selectedRowKeys) {
      Message.error('请选择用户');
      return;
    }
    postApiV1KnowledgeBaseUserInvite({
      kb_id,
      user_id: selectedRowKeys,
      perm,
    }).then(() => {
      onOk();
      Message.success('添加成功');
    });
  };

  useEffect(() => {
    if (open) {
      getData();
    } else {
      setSelectedUser(null);
      setSelectedRowKeys('');
      setPerm(ConstsUserKBPermission.UserKBPermissionFullControl);
    }
  }, [open]);

  return (
    <Modal
      title='添加管理员'
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      width={800}
    >
      <Card
        sx={{
          py: 2,
          overflow: 'hidden',
          overflowY: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: 'calc(100vh - 200px)',
        }}
      >
        <Table
          columns={columns}
          dataSource={list}
          rowKey='id'
          size='small'
          updateScrollTop={false}
          sx={{
            '& .MuiTableCell-root': {
              height: 40,
              '&:first-of-type': {
                pl: 2,
              },
            },
            '.MuiTableHead-root .cx-selection-column .MuiCheckbox-root': {
              visibility: 'hidden',
            },
          }}
          pagination={false}
          // rowSelection={{
          //   hideSelectAll: true,
          //   selectedRowKeys: selectedRowKeys,
          //   getCheckboxProps: (record: V1UserListItemResp) => {
          //     return {
          //       disabled:
          //         selectedRowKeys.length > 0
          //           ? !selectedRowKeys.includes(record.id!)
          //           : false,
          //     };
          //   },
          //   // @ts-expect-error 类型错误
          //   onChange: (selectedRowKeys: string[]) => {
          //     setSelectedRowKeys(selectedRowKeys);
          //   },
          // }}
          renderEmpty={
            loading ? (
              <Box></Box>
            ) : (
              <Stack alignItems={'center'}>
                <img src={NoData} width={150} />
                <Box
                  sx={{
                    fontSize: 12,
                    lineHeight: '20px',
                    color: 'text.auxiliary',
                  }}
                >
                  暂无数据
                </Box>
              </Stack>
            )
          }
        />
      </Card>
      <FormItem
        label={
          <Stack
            sx={{ display: 'inline-flex' }}
            direction={'row'}
            alignItems={'center'}
            gap={0.5}
          >
            权限
            {!isEnterprise && (
              <Tooltip title='企业版可用' placement='top' arrow>
                <InfoIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
              </Tooltip>
            )}
          </Stack>
        }
        sx={{ mt: 2 }}
      >
        <Select
          fullWidth
          sx={{ height: 52 }}
          value={perm}
          disabled={!isEnterprise}
          onChange={e => setPerm(e.target.value as ConstsUserKBPermission)}
        >
          <MenuItem value={ConstsUserKBPermission.UserKBPermissionFullControl}>
            完全控制
          </MenuItem>
          <MenuItem value={ConstsUserKBPermission.UserKBPermissionDocManage}>
            文档管理
          </MenuItem>
          <MenuItem value={ConstsUserKBPermission.UserKBPermissionDataOperate}>
            数据运营
          </MenuItem>
        </Select>
      </FormItem>
    </Modal>
  );
};

export default AddRole;
