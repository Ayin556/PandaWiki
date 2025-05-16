import { AppType, IconMap, ModelProvider, PageStatus } from "@/constant/enums"

export type Paging = {
  page?: number
  per_page?: number
}

export type ResposeList<T> = {
  total: number
  data: T[]
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
}

export type KnowledgeBaseStats = {
  doc_count: number,
  chunk_count: number,
  word_count: number,
}

export type KnowledgeBaseListItem = UpdateKnowledgeBaseData & {
  created_at: string,
  updated_at: string,
  stats: KnowledgeBaseStats
}

// =============================================》doc
export type DocCommon = {
  id: string,
  url: string,
  error: string,
  created_at: string,
  updated_at: string,
  source: 1 | 2 | 3,
  status: keyof typeof PageStatus,
}

export type DocListItem = DocCommon & {
  title: string,
  chunk_count: number,
  favicon: string,
  word_count: number
}

export type DocChunkListItem = {
  content: string,
  id: string,
  seq: number,
  title: string
}

export type DocDetail = DocCommon & {
  content: string,
  meta: {
    charset: string,
    description: string,
    favicon: string,
    keywords: string,
    screenshot: string,
    title: string
  },
}

export type DocAction = 'scrape' | 'publish' | 'delete'

export type UpdateDocActionData = {
  doc_ids: string[],
  action: DocAction
}

export type UpdateDocData = {
  doc_id: string,
  title?: string,
  content?: string
}

export type CreateDocData = {
  kb_id: string
  content?: string
  file_key?: string[]
  source: 1 | 2 | 3
  title?: string
  url?: string[]
}

export type ParseDocData = {
  kb_id: string
  type: 'RSS' | 'Sitemap' | 'URL'
  url: string
}

export type DocListFilterData = {
  kb_id: string
  search?: string
}

// =============================================》app

export type AppCommonInfo = {
  name: string
  type: keyof typeof AppType
}

export type CreateAppFormData = {
  icon: string
  associated_kb_ids: string[]
} & AppCommonInfo

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

export type AppSetting = {
  icon: string,
  desc: string,
  welcome_str: string,
  nav_bg_color: string,
  nav_text_color: string,
  recommend_questions: string[],
  recommend_doc_ids: string[],
  search_placeholder: string,
  position: number[]
  plugin_ids: string[]
  associated_kb_ids: string[]
} & DingBotSetting & WecomBotSetting & FeishuBotSetting

export type RecommendDoc = {
  id: string,
  title: string,
  url: string,
  summary: string
}

export type AppDetail = {
  id: string,
  link: string,
  stats: AppStats | null
  settings: AppSetting
  kb_id: string
  recommend_docs: RecommendDoc[]
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
  is_active: boolean
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