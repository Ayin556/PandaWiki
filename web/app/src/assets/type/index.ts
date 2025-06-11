export interface NavBtn {
  id: string
  url: string
  variant: 'contained' | 'outlined',
  showIcon: boolean
  icon: string
  text: string
  target: '_blank' | '_self'
}

export interface KBDetail {
  name: string,
  settings: {
    title: string,
    btns: NavBtn[],
    icon: string,
    welcome_str: string,
    search_placeholder: string,
    recommend_questions: string[],
    recommend_node_ids: string[],
    desc: string,
    keyword: string,
    auto_sitemap: boolean,
    head_code: string,
    body_code: string
  },
  recommend_nodes: RecommendNode[]
}

export type RecommendNode = {
  id: string,
  name: string,
  type: 1 | 2,
  emoji: string,
  parent_id: string,
  summary: string
  position: number
  recommend_nodes?: RecommendNode[]
}

export interface NodeDetail {
  id: string
  kb_id: string
  name: string
  content: string
  created_at: string
  updated_at: string
  meta: {
    summary: string
    emoji?: string
  }
}

export interface NodeListItem {
  id: string,
  name: string,
  type: 1 | 2,
  emoji: string,
  position: number,
  parent_id: string,
  summary: string,
  created_at: string,
  updated_at: string,
}

export interface ChunkResultItem {
  node_id: string
  name: string
  summary: string
}


export interface ITreeItem {
  id: string;
  name: string;
  level: number;
  order?: number;
  parentId?: string | null;
  children?: ITreeItem[];
  type: 1 | 2;
  emoji?: string
}
