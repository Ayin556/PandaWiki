import { ConversationListItem, getFeedbackEvaluateList } from '@/api';
import Logo from '@/assets/images/logo.png';
import NoData from '@/assets/images/nodata.png';
import { AppType, FeedbackType } from '@/constant/enums';
import { tableSx } from '@/constant/styles';
import { useURLSearchParams } from '@/hooks';
import { useAppSelector } from '@/store';
import { Box, Stack, Tooltip } from '@mui/material';
import { Ellipsis, Icon, Table } from 'ct-mui';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import Detail from './Detail';

const Evaluate = () => {
  const { kb_id = '' } = useAppSelector((state) => state.config);
  const [searchParams] = useURLSearchParams();
  const subject = searchParams.get('subject') || '';
  const remoteIp = searchParams.get('remote_ip') || '';
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const [feedbackInfo, setFeedbackInfo] = useState<any>({});

  const columns = [
    {
      dataIndex: 'subject',
      title: '问题',
      render: (text: string, record: any) => {
        const info = record.conversation_messages[1];
        return (
          <>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <Icon
                sx={{ fontSize: 12 }}
                type={
                  AppType[record.app_type as keyof typeof AppType]?.icon || ''
                }
              />
              <Ellipsis
                className='primary-color'
                sx={{ cursor: 'pointer', flex: 1, width: 0 }}
                onClick={() => {
                  setId(record.id);
                  setFeedbackInfo(record.conversation_messages);
                  setOpen(true);
                }}
              >
                {info.content}
              </Ellipsis>
            </Stack>
            <Box sx={{ color: 'text.auxiliary', fontSize: 12 }}>
              {AppType[record.app_type as keyof typeof AppType]?.label || '-'}
            </Box>
          </>
        );
      },
    },
    {
      dataIndex: 'feedback_info',
      title: '用户反馈',
      width: 160,
      render: (value: ConversationListItem['feedback_info'], record: any) => {
        const info = record.conversation_messages[0].info;
        return (
          <Tooltip
            title={
              (info?.feedback_content || value?.feedback_type > 0) && (
                <Box>
                  {info?.feedback_type > 0 && (
                    <Box>
                      {
                        FeedbackType[
                          info?.feedback_type as keyof typeof FeedbackType
                        ]
                      }
                    </Box>
                  )}
                  {info?.feedback_content && (
                    <Box>{info?.feedback_content}</Box>
                  )}
                </Box>
              )
            }
          >
            <Stack
              direction={'row'}
              alignItems={'center'}
              gap={0.5}
              sx={{ cursor: 'pointer', fontSize: 14 }}
            >
              {info?.score === 1 ? (
                <Icon
                  type='icon-dianzan-xuanzhong1'
                  sx={{ cursor: 'pointer', color: 'success.main' }}
                />
              ) : info?.score === -1 ? (
                <Icon
                  type='icon-a-diancai-weixuanzhong2'
                  sx={{ cursor: 'pointer', color: 'error.main' }}
                />
              ) : (
                <Icon
                  type='icon-dianzan-weixuanzhong'
                  sx={{ color: 'text.disabled' }}
                />
              )}
            </Stack>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'info',
      title: '来源用户',
      width: 200,
      render: (text: ConversationListItem['info'], record: any) => {
        const user = record?.user_info || {};
        return (
          <Box sx={{ fontSize: 12 }}>
            <Stack
              direction={'row'}
              alignItems={'center'}
              gap={0.5}
              sx={{ cursor: 'pointer' }}
            >
              <img src={user?.avatar || Logo} width={16} />
              <Box sx={{ fontSize: 14 }}>
                {user?.real_name || user?.name || '匿名用户'}
              </Box>
            </Stack>
            {user?.email && (
              <Box sx={{ color: 'text.auxiliary' }}>{user?.email}</Box>
            )}
          </Box>
        );
      },
    },
    {
      dataIndex: 'remote_ip',
      title: '来源 IP',
      width: 200,
      render: (text: string, record: any) => {
        const info = record.conversation_messages[1];
        const {
          city = '',
          country = '',
          province = '',
        } = record.ip_address || {};
        return (
          <>
            <Box>{info.remote_ip}</Box>
            <Box sx={{ color: 'text.auxiliary', fontSize: 12 }}>
              {country === '中国' ? `${province}-${city}` : `${country}`}
            </Box>
          </>
        );
      },
    },
    {
      dataIndex: 'created_at',
      title: '问答时间',
      width: 120,
      render: (text: string, record: any) => {
        const info = record.conversation_messages[1];
        return dayjs(info?.created_at).fromNow();
      },
    },
  ];

  const getData = () => {
    setLoading(true);
    getFeedbackEvaluateList({
      page,
      per_page: pageSize,
      kb_id,
    })
      .then((res) => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setPage(1);
  }, [subject, remoteIp, kb_id]);

  useEffect(() => {
    if (kb_id) getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, subject, remoteIp, kb_id]);

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey='id'
        height='calc(100vh - 148px)'
        size='small'
        sx={{
          overflow: 'hidden',
          ...tableSx,
          '.MuiTableContainer-root': {
            height: 'calc(100vh - 148px - 70px)',
          },
        }}
        pagination={{
          total,
          page,
          pageSize,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        PaginationProps={{
          sx: {
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 2,
            '.MuiSelect-root': {
              width: 100,
            },
          },
        }}
        renderEmpty={
          loading ? (
            <Box></Box>
          ) : (
            <Stack alignItems={'center'} sx={{ mt: 20 }}>
              <img src={NoData} width={174} />
              <Box>暂无数据</Box>
            </Stack>
          )
        }
      />
      <Detail
        id={id}
        open={open}
        data={feedbackInfo}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
};

export default Evaluate;
