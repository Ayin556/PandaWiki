import React, { useEffect, useMemo, useState } from 'react';
import { SettingCardItem } from '../Common';
import { Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Modal, message } from '@ctzhian/ui';
import NoData from '@/assets/images/nodata.png';
import { Stack } from '@mui/material';
import { Box } from '@mui/material';
import {
  GithubComChaitinPandaWikiProApiAuthV1AuthGroupListItem,
  GithubComChaitinPandaWikiProApiAuthV1AuthItem,
} from '@/request/pro/types';
import UserGroupModal from '../UserGroupModal';
import { useAppSelector } from '@/store';
import {
  getApiProV1AuthGroupTree,
  patchApiProV1AuthGroupMove,
  deleteApiProV1AuthGroupDelete,
} from '@/request/pro/AuthGroup';
import GroupTree from './GroupTree';

interface UserGroupProps {
  enabled: string;
  memberList: GithubComChaitinPandaWikiProApiAuthV1AuthItem[];
}

const UserGroup = ({ enabled, memberList }: UserGroupProps) => {
  const { license, kb_id } = useAppSelector(state => state.config);
  const [userGroupModalOpen, setUserGroupModalOpen] = useState(false);
  const [userGroupModalType, setUserGroupModalType] = useState<'add' | 'edit'>(
    'add',
  );
  const [userGroupModalData, setUserGroupModalData] =
    useState<GithubComChaitinPandaWikiProApiAuthV1AuthGroupListItem>();
  const [userGroupTree, setUserGroupTree] = useState<
    GithubComChaitinPandaWikiProApiAuthV1AuthGroupListItem[]
  >([]);

  const isEnterprise = useMemo(() => {
    return license.edition === 2;
  }, [license]);

  const onDeleteUserGroup = (id: number) => {
    Modal.confirm({
      title: '删除用户组',
      content: '确定要删除该用户组吗？',
      okButtonProps: {
        color: 'error',
      },
      onOk: () => {
        deleteApiProV1AuthGroupDelete({
          id,
          kb_id,
        }).then(() => {
          message.success('删除成功');
          getUserGroup();
        });
      },
    });
  };

  const getUserGroup = () => {
    getApiProV1AuthGroupTree({ kb_id }).then(res => {
      setUserGroupTree(res?.list || []);
    });
  };
  useEffect(() => {
    if (!kb_id || enabled !== '2' || !isEnterprise) return;
    getUserGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kb_id, enabled, isEnterprise]);

  const handleMove = async ({
    id,
    newParentId,
    prev_id,
    next_id,
  }: {
    id: number;
    newParentId?: number;
    prev_id?: number;
    next_id?: number;
  }) => {
    await patchApiProV1AuthGroupMove({
      id,
      kb_id,
      parent_id: newParentId,
      prev_id,
      next_id,
    });
    getUserGroup();
  };

  return (
    <SettingCardItem
      title='用户组'
      more={
        !isEnterprise && (
          <Tooltip title='企业版可用' placement='top' arrow>
            <InfoIcon sx={{ color: 'text.secondary', fontSize: 14, ml: 1 }} />
          </Tooltip>
        )
      }
    >
      <Box
        sx={{
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: '10px',
          p: 1,
          maxHeight: 400,
          overflow: 'auto',
        }}
      >
        <GroupTree
          data={userGroupTree}
          onMove={handleMove}
          onDelete={onDeleteUserGroup}
          onClickMembers={item => {
            setUserGroupModalData({
              id: item.id,
              name: item.name,
              auth_ids: item.auth_ids,
            });
            setUserGroupModalOpen(true);
            setUserGroupModalType('edit');
          }}
          onEdit={(item, type) => {
            setUserGroupModalData({
              id: item.id,
              name: item.name,
              auth_ids: item.auth_ids,
            });
            setUserGroupModalOpen(true);
            setUserGroupModalType(type);
          }}
        />
      </Box>
      <UserGroupModal
        open={userGroupModalOpen}
        onCancel={() => {
          setUserGroupModalOpen(false);
          setUserGroupModalData(undefined);
        }}
        onOk={() => {
          getUserGroup();
          setUserGroupModalOpen(false);
          setUserGroupModalData(undefined);
        }}
        userList={memberList}
        data={userGroupModalData}
        type={userGroupModalType}
      />
    </SettingCardItem>
  );
};

export default UserGroup;
