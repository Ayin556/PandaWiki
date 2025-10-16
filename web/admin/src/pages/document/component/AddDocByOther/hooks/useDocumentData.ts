import { ImportDocType } from '@/api';
import { useCallback, useMemo, useState } from 'react';
import { DataItem, TotalCount } from '../types';

export const useDocumentData = (type: ImportDocType) => {
  const [data, setData] = useState<DataItem[]>([]);
  const [folderChildrenData, setFolderChildrenData] = useState<DataItem[]>([]);
  const [checked, setChecked] = useState<string[]>([]);

  const isFeishuType = type === 'Feishu';

  // 统一的数据访问器
  const currentData = useMemo(
    () => (isFeishuType ? folderChildrenData : data),
    [isFeishuType, folderChildrenData, data],
  );

  // 统一的状态更新方法
  const updateItemStatus = useCallback(
    (
      uuid: string,
      updates: Partial<DataItem> | ((item: DataItem) => Partial<DataItem>),
    ) => {
      const updateFn = (prev: DataItem[]) =>
        prev.map(item => {
          if (item.uuid !== uuid) return item;
          const itemUpdates =
            typeof updates === 'function' ? updates(item) : updates;
          return { ...item, ...itemUpdates };
        });

      if (isFeishuType) {
        setFolderChildrenData(updateFn);
      } else {
        setData(updateFn);
      }
    },
    [isFeishuType],
  );

  // 批量更新状态
  const updateMultipleItemsStatus = useCallback(
    (uuids: string[], updates: Partial<DataItem>) => {
      const updateFn = (prev: DataItem[]) =>
        prev.map(item =>
          uuids.includes(item.uuid) ? { ...item, ...updates } : item,
        );

      if (isFeishuType) {
        setFolderChildrenData(updateFn);
      } else {
        setData(updateFn);
      }
    },
    [isFeishuType],
  );

  // 计算总数统计
  const totalCount = useMemo((): TotalCount => {
    const total: TotalCount = {
      loading: 0,
      fail: 0,
      waiting: 0,
      default: 0,
      uploading: 0,
      pulling: 0,
      creating: 0,
      'upload-done': 0,
      'pull-done': 0,
      success: 0,
      'upload-error': 0,
      'pull-error': 0,
      error: 0,
    };

    const allData = isFeishuType ? folderChildrenData : data;

    allData.forEach(item => {
      if (['uploading', 'pulling', 'creating'].includes(item.status)) {
        total.loading++;
      } else if (
        ['upload-error', 'pull-error', 'error'].includes(item.status)
      ) {
        total.fail++;
      }
      if (
        !['uploading', 'pulling', 'creating', 'success'].includes(item.status)
      ) {
        total.waiting++;
      }
      total[item.status as keyof TotalCount]++;
    });

    return total;
  }, [data, folderChildrenData, isFeishuType]);

  // 重置所有数据
  const resetData = useCallback(() => {
    setData([]);
    setFolderChildrenData([]);
    setChecked([]);
  }, []);

  // 选择操作
  const toggleSelect = useCallback(
    (item: DataItem) => {
      if (item.type === 'folder') {
        const spaceChildren = folderChildrenData.filter(
          it => it.space_id === item.space_id,
        );
        const currentSelected = folderChildrenData.filter(
          it => checked.includes(it.uuid) && it.space_id === item.space_id,
        ).length;

        if (currentSelected !== spaceChildren.length) {
          setChecked(prev => [
            ...new Set([...prev, ...spaceChildren.map(it => it.uuid)]),
          ]);
        } else {
          setChecked(prev =>
            prev.filter(it => !spaceChildren.some(child => child.uuid === it)),
          );
        }
      } else {
        setChecked(prev =>
          prev.includes(item.uuid)
            ? prev.filter(it => it !== item.uuid)
            : [...prev, item.uuid],
        );
      }
    },
    [folderChildrenData, checked],
  );

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    const targetData = isFeishuType ? folderChildrenData : data;
    setChecked(prev =>
      targetData.length > prev.length ? targetData.map(item => item.uuid) : [],
    );
  }, [isFeishuType, folderChildrenData, data]);

  return {
    data,
    setData,
    folderChildrenData,
    setFolderChildrenData,
    checked,
    setChecked,
    currentData,
    totalCount,
    updateItemStatus,
    updateMultipleItemsStatus,
    resetData,
    toggleSelect,
    toggleSelectAll,
  };
};
