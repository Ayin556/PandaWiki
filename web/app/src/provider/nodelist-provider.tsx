"use client";

import { NodeListItem } from '@/assets/type';
import { getAuthStatus } from '@/utils/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { useKBDetail } from './kb-provider';

interface NodeListContextType {
  nodeList?: NodeListItem[];
  loading: boolean;
  refreshNodeList: () => Promise<void>;
}

export const NodeListContext = createContext<NodeListContextType>({
  nodeList: undefined,
  loading: false,
  refreshNodeList: async () => { },
});

export const useNodeList = () => useContext(NodeListContext);

export default function NodeListProvider({
  children,
  nodeList: initialNodeList,
}: {
  children: React.ReactNode
  nodeList?: NodeListItem[]
}) {
  const [nodeList, setNodeList] = useState<NodeListItem[] | undefined>(initialNodeList);
  const [loading, setLoading] = useState(false);
  const { kb_id } = useKBDetail();

  const fetchNodeList = async () => {
    if (!kb_id) return;

    setLoading(true);
    try {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie =>
        cookie.trim().startsWith(`auth_${kb_id}=`)
      );
      const authToken = authCookie ? authCookie.split('=')[1] : '';

      const response = await fetch('/share/v1/node/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-kb-id': kb_id,
          'X-Simple-Auth-Password': authToken,
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setNodeList(result.data);
        } else {
          console.error('API 返回数据格式错误:', result);
        }
      } else {
        console.error('获取节点列表失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('获取节点列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNodeList = async () => {
    await fetchNodeList();
  };

  useEffect(() => {
    if (!initialNodeList && kb_id && getAuthStatus(kb_id)) {
      fetchNodeList();
    }
  }, [kb_id, initialNodeList]);

  return (
    <NodeListContext.Provider value={{
      nodeList,
      loading,
      refreshNodeList
    }}>
      {children}
    </NodeListContext.Provider>
  );
}
