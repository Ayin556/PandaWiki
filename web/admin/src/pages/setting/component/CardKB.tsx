import { updateKnowledgeBase } from '@/api';
import {
  getApiV1KnowledgeBaseUserList,
  deleteApiV1KnowledgeBaseUserDelete,
  patchApiV1KnowledgeBaseUserUpdate,
} from '@/request/KnowledgeBase';
import {
  DomainKnowledgeBaseDetail,
  ConstsUserKBPermission,
  V1KBUserListItemResp,
} from '@/request/types';
import { useAppSelector } from '@/store';
import { setKbList } from '@/store/slices/config';
import {
  Box,
  Button,
  IconButton,
  Select,
  Stack,
  TextField,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { Message, Icon, Ellipsis, Modal } from 'ct-mui';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SettingCard, SettingCardItem } from './Common';
import AddRole from './AddRole';
import InfoIcon from '@mui/icons-material/Info';

interface CardKBProps {
  kb: DomainKnowledgeBaseDetail;
}

const CardKB = ({ kb }: CardKBProps) => {
  const { kbList, kb_id, license } = useAppSelector(state => state.config);
  const dispatch = useDispatch();
  const [kbName, setKbName] = useState(kb.name);
  const [isEdit, setIsEdit] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [adminList, setAdminList] = useState<V1KBUserListItemResp[]>([]);

  const getUserList = () => {
    getApiV1KnowledgeBaseUserList({
      kb_id,
    }).then(res => {
      setAdminList(res || []);
    });
  };

  const isEnterprise = useMemo(() => {
    return license.edition === 2;
  }, [license]);

  useEffect(() => {
    if (!kb_id) return;
    getUserList();
  }, [kb_id]);

  const handleSave = () => {
    if (!kb.id) return;
    updateKnowledgeBase({ id: kb.id, name: kbName }).then(() => {
      Message.success('保存成功');
      dispatch(
        setKbList(
          kbList.map(item =>
            item.id === kb.id ? { ...item, name: kbName } : item,
          ),
        ),
      );
      setIsEdit(false);
    });
  };

  const onDeleteUser = (id: string) => {
    Modal.confirm({
      title: '删除管理员',
      content: '确定删除该管理员吗？',
      okButtonProps: {
        color: 'error',
      },
      onOk: () => {
        deleteApiV1KnowledgeBaseUserDelete({
          kb_id,
          user_id: id,
        }).then(() => {
          getUserList();
          Message.success('删除成功');
        });
      },
    });
  };

  const onUpdateUserPermission = (id: string, perm: ConstsUserKBPermission) => {
    patchApiV1KnowledgeBaseUserUpdate({
      kb_id,
      user_id: id,
      perm,
    }).then(() => {
      getUserList();
      Message.success('更新成功');
    });
  };

  useEffect(() => {
    setKbName(kb.name);
  }, [kb]);

  return (
    <SettingCard title='后台信息'>
      <SettingCardItem title='知识库名称' isEdit={isEdit} onSubmit={handleSave}>
        <TextField
          fullWidth
          value={kbName}
          onChange={e => {
            setKbName(e.target.value);
            setIsEdit(true);
          }}
        />
      </SettingCardItem>

      <SettingCardItem
        title='管理员'
        extra={
          <Button
            size='small'
            startIcon={<Icon type='icon-tianjiachengyuan' />}
            onClick={() => setAddOpen(true)}
          >
            添加成员
          </Button>
        }
      >
        <Box
          sx={{
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
            maxHeight: 300,
          }}
        >
          {adminList.map((it, idx) => (
            <Stack
              key={idx}
              direction={'row'}
              alignItems={'center'}
              gap={8}
              justifyContent={'space-between'}
              sx={{
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-of-type': {
                  borderBottom: 'none',
                },
              }}
            >
              <Stack
                direction={'row'}
                alignItems={'center'}
                gap={2}
                sx={{ flex: 1, minWidth: 0 }}
              >
                {/* <Avatar sx={{ width: 20, height: 20 }} /> */}
                <Ellipsis sx={{ fontSize: 14 }}>{it.account}</Ellipsis>
              </Stack>

              <Stack direction={'row'} alignItems={'center'}>
                <Select
                  size='small'
                  sx={{ width: 180 }}
                  value={it.perms}
                  disabled={!isEnterprise || it.role === 'admin'}
                  onChange={e =>
                    onUpdateUserPermission(
                      it.id!,
                      e.target.value as ConstsUserKBPermission,
                    )
                  }
                >
                  <MenuItem
                    value={ConstsUserKBPermission.UserKBPermissionFullControl}
                  >
                    完全控制
                  </MenuItem>
                  <MenuItem
                    value={ConstsUserKBPermission.UserKBPermissionDocManage}
                  >
                    文档管理
                  </MenuItem>
                  <MenuItem
                    value={ConstsUserKBPermission.UserKBPermissionDataOperate}
                  >
                    数据运营
                  </MenuItem>
                </Select>

                <Tooltip
                  title={
                    it.role === 'admin' ? '管理员不可修改权限' : '企业版可用'
                  }
                  placement='top'
                  arrow
                >
                  <InfoIcon
                    sx={{
                      color: 'text.secondary',
                      fontSize: 14,
                      ml: 1,
                      visibility:
                        !isEnterprise || it.role === 'admin'
                          ? 'visible'
                          : 'hidden',
                    }}
                  />
                </Tooltip>
              </Stack>

              <Tooltip
                title={it.role === 'admin' ? '管理员不可删除' : ''}
                placement='top'
                arrow
              >
                <Icon
                  type='icon-icon_tool_close'
                  sx={{
                    cursor: it.role === 'admin' ? 'not-allowed' : 'pointer',
                    color: it.role === 'admin' ? 'text.disabled' : 'error.main',
                  }}
                  onClick={() => {
                    if (it.role === 'admin') return;
                    onDeleteUser(it.id!);
                  }}
                />
              </Tooltip>
            </Stack>
          ))}
        </Box>
      </SettingCardItem>

      <AddRole
        open={addOpen}
        selectedIds={adminList.map(it => it.id!)}
        onCancel={() => setAddOpen(false)}
        onOk={() => {
          getUserList();
          setAddOpen(false);
        }}
      />
    </SettingCard>
  );
};

export default CardKB;
