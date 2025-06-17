import { ITreeItem, NodeListItem } from "@/assets/type";

export function convertToTree(data: NodeListItem[]) {
  const map: { [key: string]: ITreeItem } = {};
  const tree: ITreeItem[] = [];

  data.forEach(item => {
    map[item.id] = {
      id: item.id,
      name: item.name,
      level: 0,
      emoji: item.emoji,
      order: item.position,
      type: item.type,
      parentId: item.parent_id || null,
      children: [],
    };
  });

  data.forEach(item => {
    const node = map[item.id];
    if (node.parentId && map[node.parentId]) {
      node.level = (map[node.parentId].level || 0) + 1;
      if (map[node.parentId]) {
        if (!map[node.parentId].children) {
          map[node.parentId].children = [];
        }
        map[node.parentId].children!.push(node);
        map[node.parentId].children!.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    } else {
      node.level = 0;
      tree.push(node);
    }
  });

  tree.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return tree;
}

export const filterEmptyFolders = (data: ITreeItem[]): ITreeItem[] => {
  return data
    .map(item => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterEmptyFolders(item.children)
        return { ...item, children: filteredChildren }
      }
      return item
    })
    .filter(item => {
      if (item.type === 1) {
        return item.children && item.children.length > 0
      }
      return true
    })
}

export const findFirstType2Node = (nodes: ITreeItem[]): string | null => {
  for (const node of nodes) {
    if (node.type === 2) {
      return node.id;
    }
    if (node.children && node.children.length > 0) {
      const found = findFirstType2Node(node.children);
      if (found) return found;
    }
  }
  return null;
};

export const addExpandState = (nodes: ITreeItem[], activeId: string, defaultExpand: boolean): ITreeItem[] => {
  const findParentPath = (nodes: ITreeItem[], targetId: string, path: string[] = []): string[] | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return path;
      }
      if (node.children && node.children.length > 0) {
        const found = findParentPath(node.children, targetId, [...path, node.id]);
        if (found) return found;
      }
    }
    return null;
  };

  const parentPath = findParentPath(nodes, activeId) || [];
  const parentSet = new Set(parentPath);

  const addExpand = (nodes: ITreeItem[]): ITreeItem[] => {
    return nodes.map(node => {
      const isExpanded = parentSet.has(node.id) ? true : defaultExpand;
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          defaultExpand: isExpanded,
          children: addExpand(node.children)
        };
      }
      return node;
    });
  };

  return addExpand(nodes);
};