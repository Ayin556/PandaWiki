import { ITreeItem, NodeListItem } from "@/assets/type";

export function convertToTree(data: NodeListItem[]) {
  const map: { [key: string]: ITreeItem } = {};
  const tree: ITreeItem[] = [];

  data.forEach(item => {
    map[item.id] = {
      id: item.id,
      name: item.name,
      level: 0,
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