"use client";

import { NodeListItem } from '@/assets/type';
import { createContext, useContext } from 'react';

export const NodeListContext = createContext<{
  nodeList?: NodeListItem[]
}>({
  nodeList: undefined,
})

export const useNodeList = () => useContext(NodeListContext);

export default function NodeListProvider({
  children,
  nodeList,
}: {
  children: React.ReactNode
  nodeList?: NodeListItem[]
}) {
  return <NodeListContext.Provider value={{ nodeList }}>{children}</NodeListContext.Provider>
}
