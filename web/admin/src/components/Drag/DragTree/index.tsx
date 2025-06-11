import { ITreeItem, moveNode } from "@/api";
import { AppContext, getSiblingItemIds } from "@/constant/drag";
import { DndContext } from "@dnd-kit/core";
import {
  SortableTree,
  TreeItems
} from "dnd-kit-sortable-tree";
import { ItemChangedReason } from "dnd-kit-sortable-tree/dist/types";
import { useEffect, useState } from "react";
import TreeItem from "./TreeItem";

interface DragTreeProps {
  data: ITreeItem[]
  refresh: () => void
  batchOpen: boolean
  type?: 'select' | 'move'
  selected?: string[]
  onSelectChange?: (value: string) => void
}
const DragTree = ({ data, refresh, batchOpen, type = 'move', selected, onSelectChange }: DragTreeProps) => {
  const [items, setItems] = useState<TreeItems<ITreeItem>>(data);

  useEffect(() => {
    setItems(data)
  }, [data])

  return <AppContext.Provider value={{
    items,
    setItems,
    refresh,
    type,
    selected,
    onSelectChange,
    batchOpen,
  }}>
    <DndContext>
      <SortableTree
        items={items}
        onItemsChanged={(items: TreeItems<ITreeItem>, reason: ItemChangedReason<ITreeItem>) => {
          if (reason.type === 'dropped') {
            const { draggedItem } = reason;
            const { parentId = null, id } = draggedItem
            const { prevItemId, nextItemId } = getSiblingItemIds(items, id)
            moveNode({ id, parent_id: parentId, next_id: nextItemId, prev_id: prevItemId }).then(() => {
              refresh?.()
            })
          }
          setItems(items)
        }}
        TreeItemComponent={TreeItem}
      />
    </DndContext>
  </AppContext.Provider>
}

export default DragTree