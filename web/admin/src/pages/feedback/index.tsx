import {
  FeedbackListItem,
  getFeedbackList,
  deleteFeedback,
  getKnowledgeBaseDetail,
} from '@/api';
import NoData from '@/assets/images/nodata.png';
import Card from '@/components/Card';
import { tableSx } from '@/constant/styles';
import { useURLSearchParams } from '@/hooks';
import { useAppSelector } from '@/store';
import { Box, Button, ButtonBase, Stack, Tooltip } from '@mui/material';
import { Ellipsis, Icon, Table, Modal, CusTabs } from 'ct-mui';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const Feedback = () => {
  const { kb_id = '' } = useAppSelector((state) => state.config);
  const [searchParams] = useURLSearchParams();
  const subject = searchParams.get('subject') || '';
  const remoteIp = searchParams.get('remote_ip') || '';
  const [data, setData] = useState<FeedbackListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [baseUrl, setBaseUrl] = useState('');
  const [tab, setTab] = useState('feedback');

  const onDeleteComment = (id: string) => {
    Modal.confirm({
      title: '删除评论',
      content: '确定要删除该评论吗？',
      onOk: () => {
        deleteFeedback({ id }).then(() => {
          if (page === 1) {
            getData();
          } else {
            setPage(1);
          }
        });
      },
    });
  };

  const columns = [
    {
      dataIndex: 'node_name',
      title: '文档',
      width: 300,
      render: (text: string, record: FeedbackListItem) => {
        return (
          <Ellipsis
            className='primary-color'
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              window.open(`${baseUrl}/node/${record.node_id}`, '_blank');
            }}
          >
            {text}
          </Ellipsis>
        );
      },
    },
    {
      dataIndex: 'info',
      title: '姓名',
      width: 160,
      render: (text: FeedbackListItem['info']) => {
        return <Box>{text?.user_name}</Box>;
      },
    },
    {
      dataIndex: 'content',
      title: '评论内容',
      render: (text: FeedbackListItem['content']) => {
        return text;
      },
    },

    {
      dataIndex: 'created_at',
      title: '发布时间',
      width: 220,
      render: (text: string) => {
        return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
      },
    },

    {
      dataIndex: 'opt',
      title: '操作',
      width: 120,
      render: (text: string, record: FeedbackListItem) => {
        return (
          <ButtonBase
            disableRipple
            sx={{
              color: 'error.main',
            }}
            onClick={() => {
              onDeleteComment(record.id);
            }}
          >
            删除
          </ButtonBase>
        );
      },
    },
  ];

  const getData = () => {
    setLoading(true);
    getFeedbackList({
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

  useEffect(() => {
    if (kb_id) {
      getKnowledgeBaseDetail({ id: kb_id }).then((res) => {
        setBaseUrl(res.access_settings.base_url);
      });
    }
  }, [kb_id]);

  return (
    <Card>
      <Stack
        direction='row'
        alignItems={'center'}
        justifyContent={'space-between'}
        sx={{ p: 2 }}
      >
        <CusTabs
          value={tab}
          onChange={(value) => {
            setTab(value as string);
          }}
          size='small'
          list={[
            { label: 'AI 问答评价', value: 'ai_feedback', disabled: true },
            { label: '文档评论', value: 'feedback' },
            { label: '文档纠错', value: 'correction', disabled: true },
          ]}
        />
      </Stack>
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
    </Card>
  );
};

export default Feedback;
