import { AppType, IconMap, ModelProvider } from "@/constant/enums"

export type Paging = {
  page?: number
  per_page?: number
}

export type ResposeList<T> = {
  total: number
  data: T[]
}

export interface BaseItem {
  id: string
}

export type TrendData = { count: number, date: string }

// =============================================》user
export type UserForm = {
  account: string,
  password: string,
}

export type UserInfo = {
  id: string,
  account: string,
  last_access?: string,
  created_at?: string
}

export type UpdateUserInfo = {
  id: string
  new_password: string
}

// =============================================》knowledge base
export type UpdateKnowledgeBaseData = {
  id: string,
  name: string,
  access_settings: {
    hosts?: string[],
    ports?: number[],
    ssl_ports?: number[],
    private_key?: string,
    public_key?: string,
  }
}

export interface KnowledgeBaseFormData {
  name: string
  domain: string
  http: boolean
  https: boolean
  httpsCert: string
  httpsKey: string
}

export type KnowledgeBaseAccessSettings = {
  hosts: string[] | null,
  ports: number[] | null,
  private_key: string,
  public_key: string,
  ssl_ports: number[] | null
}

export type KnowledgeBaseStats = {
  doc_count: number,
  chunk_count: number,
  word_count: number,
}

export type KnowledgeBaseListItem = Pick<UpdateKnowledgeBaseData, 'id' | 'name'> & {
  created_at: string,
  updated_at: string,
  access_settings: KnowledgeBaseAccessSettings,
  stats: KnowledgeBaseStats
}

export interface CardWebHeaderBtn {
  id: string
  url: string
  variant: 'contained' | 'outlined',
  showIcon: boolean
  icon: string
  text: string
  target: '_blank' | '_self'
}

// =============================================》node
export type NodeListItem = {
  id: string,
  name: string,
  type: 1 | 2,
  position: number,
  parent_id: string,
  summary: string,
  created_at: string,
  updated_at: string,
}

export type GetNodeRecommendData = {
  kb_id: string
  node_ids: string[]
}

export type CreateNodeSummaryData = {
  kb_id: string
  id: string
}

export type NodeDetail = {
  content: string,
  created_at: string,
  id: string,
  kb_id: string,
  meta: {
    summary: string
  },
  name: string,
  updated_at: string
}

export type CreateNodeData = {
  kb_id: string
  content?: string
  name?: string
  parent_id?: string | null
  type: 1 | 2
}

export type NodeListFilterData = {
  kb_id: string
  search?: string
}

export type NodeAction = 'delete'

export type UpdateNodeActionData = {
  id: string,
  kb_id: string,
  action: NodeAction
}

export type UpdateNodeData = {
  id: string,
  kb_id: string,
  name?: string,
  content?: string
}

// =============================================》crawler

export type ScrapeRSSItem = {
  desc: string,
  published: string,
  title: string,
  url: string
}

// =============================================》app

export type AppCommonInfo = {
  name: string
  type: keyof typeof AppType
}

export type AppStats = {
  day_counts: TrendData[],
  last_24h_count: number,
  last_24h_ip_count: number
}

export type AppListItem = {
  id: string,
  link: string,
  stats: AppStats | null
  settings: {
    icon: string,
  },
} & AppCommonInfo

export type DingBotSetting = {
  dingbot_client_id: string,
  dingbot_token: string,
  dingbot_aes_key: string,
  dingbot_welcome_str: string,
}

export type WecomBotSetting = {
  wecombot_agent_id: number
  wecombot_corp_secret: string
  wecombot_suite_token: string
  wecombot_suite_id: string
  wecombot_suite_encoding_aes_key: string
  wecombot_corp_id: string
  wecombot_welcome_str: string
}

export type FeishuBotSetting = {
  feishubot_app_id: string
  feishubot_app_secret: string
  feishubot_verification_token: string
  feishubot_encrypt_key: string
  feishubot_welcome_str: string
}

export type HeaderSetting = {
  title: string,
  icon: string,
  btns: CardWebHeaderBtn[],
}

export type WelcomeSetting = {
  welcome_str: string,
  search_placeholder: string,
  recommend_questions: string[],
  recommend_node_ids: string[],
}

export type SEOSetting = {
  keyword: string,
  desc: string,
  auto_sitemap: boolean,
}

export type CustomCodeSetting = {
  head_code: string,
  body_code: string
}

export type AppSetting = HeaderSetting & WelcomeSetting & SEOSetting & CustomCodeSetting & DingBotSetting & WecomBotSetting & FeishuBotSetting

export type RecommendNode = {
  id: string,
  name: string,
  type: 1 | 2,
  parent_id: string,
  summary: string
  position: number
  recommend_nodes?: RecommendNode[]
}

export type AppDetail = {
  id: string,
  link: string,
  stats: AppStats | null
  settings: AppSetting
  kb_id: string
  recommend_nodes: RecommendNode[]
} & AppCommonInfo

export type UpdateAppDetailData = {
  name?: string
  settings?: Partial<AppSetting>
}

export type AppConfigEditData = {
  link: string
  name: string
  recommend_questions: string[]
  search_placeholder: string
  icon: string
  desc: string
  position: number[]
  plugin_ids: string[]
  associated_kb_ids: string[]
}

// =============================================》model

export type GetModelNameData = {
  type: 'chat' | 'embedding' | 'reranker',
  provider: keyof typeof ModelProvider | '',
  api_header: string,
  api_key: string,
  base_url: string
}

export type CreateModelData = {
  model: string
} & GetModelNameData

export type CheckModelData = {
  api_version: string
} & CreateModelData

export type UpdateModelData = {
  id: string
} & CheckModelData

export type ModelListItem = {
  completion_tokens: number,
  id: string,
  model: keyof typeof IconMap,
  type: 'chat' | 'embedding' | 'reranker'
  api_version: string,
  prompt_tokens: number,
  total_tokens: number
} & GetModelNameData

// =============================================》conversation

export type GetConversationListData = {
  kb_id?: string,
  remote_ip?: string,
  subject?: string,
} & Paging

export type ConversationListItem = {
  app_name: string,
  created_at: string,
  id: string,
  model: string,
  ip_address: {
    city: string,
    country: string,
    ip: string,
    province: string
  },
  remote_ip: string,
  subject: string
}

export type ConversationDetail = {
  app_id: string,
  created_at: string,
  id: string,
  remote_ip: string,
  subject: string
  messages: {
    app_id: string,
    completion_tokens: number,
    content: string,
    conversation_id: string,
    created_at: string,
    id: string,
    model: string,
    prompt_tokens: number,
    provider: keyof typeof ModelProvider,
    remote_ip: string,
    role: 'assistant' | 'user',
    total_tokens: number
  }[],
  references: {
    app_id: string,
    conversation_id: string,
    doc_id: string,
    favicon: string,
    title: string,
    url: string
  }[],
}

export type ChatConversationItem = {
  role: 'assistant' | 'user',
  content: string,
}

export interface ITreeItem {
  id: string;
  name: string;
  level: number;
  order?: number;
  parentId?: string | null;
  summary?: string
  children?: ITreeItem[];
  type: 1 | 2;
  isEditting?: boolean;
  canHaveChildren?: boolean;
  updated_at?: string;
}
