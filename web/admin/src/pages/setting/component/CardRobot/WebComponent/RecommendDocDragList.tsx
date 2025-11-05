import { ITreeItem, NodeListFilterData } from '@/api';
import DragRecommend from '@/components/Drag/DragRecommend';
import {
  DomainRecommendNodeListResp,
  getApiV1NodeList,
  getApiV1NodeRecommendNodes,
} from '@/request';
import { useAppSelector } from '@/store';
import { convertToTree } from '@/utils/drag';
import { filterEmptyFolders } from '@/utils/tree';
import { Button, Stack } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import AddRecommendContent from '../../AddRecommendContent';

const RecommendDocDragList = ({
  ids,
  onChange,
}: {
  ids: string[];
  onChange: (ids: string[]) => void;
}) => {
  const { kb_id } = useAppSelector(state => state.config);
  const [data, setData] = useState<DomainRecommendNodeListResp[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ITreeItem[]>([]);

  const getDetail = (node_ids: string[]) => {
    if (kb_id && node_ids.length > 0) {
      getApiV1NodeRecommendNodes({
        kb_id,
        node_ids,
      }).then(res => {
        setData(res || []);
      });
    }
  };

  const getData = useCallback(() => {
    setLoading(true);
    const params: NodeListFilterData = { kb_id };
    getApiV1NodeList(params)
      .then(res => {
        const filterData =
          res?.filter(item => item.type === 1 || item.status === 2) || [];
        const filterTreeData = convertToTree(filterData);
        const showTreeData = filterEmptyFolders(filterTreeData);
        setList(showTreeData);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [kb_id]);

  useEffect(() => {
    getDetail(ids);
  }, [ids]);

  useEffect(() => {
    if (kb_id) getData();
  }, [kb_id, getData]);

  return (
    <Stack gap={1}>
      <DragRecommend data={data} onChange={value => setData(value)} />
      <Button
        color='primary'
        onClick={() => setOpen(true)}
        sx={{
          alignSelf: 'flex-start',
        }}
      >
        添加文档
      </Button>
      <AddRecommendContent
        open={open}
        selected={ids}
        onChange={onChange}
        onClose={() => setOpen(false)}
      />
    </Stack>
  );
};

export default RecommendDocDragList;
