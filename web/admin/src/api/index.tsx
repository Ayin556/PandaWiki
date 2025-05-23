import { AxiosProgressEvent } from "axios"
import request from "./request"
import {
  AppDetail,
  AppListItem,
  CheckModelData,
  ConversationDetail,
  ConversationListItem,
  CreateAppFormData,
  CreateModelData,
  CreateNodeData,
  GetConversationListData,
  GetModelNameData,
  KnowledgeBaseListItem,
  ModelListItem,
  NodeDetail,
  NodeListFilterData,
  NodeListItem,
  ParseNodeData,
  ResposeList,
  UpdateAppDetailData,
  UpdateKnowledgeBaseData,
  UpdateModelData,
  UpdateNodeActionData,
  UpdateNodeData,
  UpdateUserInfo,
  UserForm,
  UserInfo
} from "./type"

export type * from "./type"

// =============================================》user

export const login = (data: UserForm): Promise<{ token: string }> =>
  request({ url: 'api/v1/user/login', method: 'post', data })

export const getUserList = (): Promise<UserInfo[]> =>
  request({ url: 'api/v1/user/list', method: 'get' })

export const getUser = (): Promise<UserInfo> =>
  request({ url: 'api/v1/user', method: 'get' })

export const createUser = (data: UserForm): Promise<void> =>
  request({ url: 'api/v1/user/create', method: 'post', data })

export const updateUser = (data: UpdateUserInfo): Promise<void> =>
  request({ url: 'api/v1/user/reset_password', method: 'put', data })

// =============================================》knowledge base

export const getKnowledgeBaseList = (): Promise<KnowledgeBaseListItem[]> =>
  request({ url: 'api/v1/knowledge_base/list', method: 'get' })

export const getKnowledgeBaseDetail = (params: { id: string }): Promise<KnowledgeBaseListItem> =>
  request({ url: 'api/v1/knowledge_base/detail', method: 'get', params })

export const updateKnowledgeBase = (data: Partial<UpdateKnowledgeBaseData>): Promise<void> =>
  request({ url: 'api/v1/knowledge_base/detail', method: 'put', data })

export const createKnowledgeBase = (data: Partial<UpdateKnowledgeBaseData>): Promise<{ id: string }> =>
  request({ url: 'api/v1/knowledge_base', method: 'post', data })

export const deleteKnowledgeBase = (params: { id: string }): Promise<void> =>
  request({ url: 'api/v1/knowledge_base/detail', method: 'delete', params })

// =============================================》node

export const getNodeList = (params: NodeListFilterData): Promise<NodeListItem[]> =>
  request({ url: 'api/v1/node/list', method: 'get', params })

export const moveNode = (data: { id: string, parent_id: string | null, next_id: string | null, prev_id: string | null }): Promise<void> =>
  request({ url: 'api/v1/node/move', method: 'post', data })

export const getNodeDetail = (params: { id: string }): Promise<NodeDetail> =>
  request({ url: 'api/v1/node/detail', method: 'get', params })

export const updateNodeAction = (data: UpdateNodeActionData): Promise<void> =>
  request({ url: 'api/v1/node/action', method: 'post', data })

export const updateNode = (data: UpdateNodeData): Promise<void> =>
  request({ url: 'api/v1/node/detail', method: 'put', data })

export const createNode = (data: CreateNodeData): Promise<{ ids: string[] }> =>
  request({ url: 'api/v1/node', method: 'post', data })

export const parseNodeUrl = (data: ParseNodeData): Promise<{
  items?: { title: string, url: string, published: string, desc: string }[]
}> =>
  request({ url: 'api/v1/node/parse_url', method: 'post', data })

// =============================================》file

export const uploadFile = (
  data: FormData,
  config?: {
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void
  }): Promise<{ key: string }> =>
  request({ url: 'api/v1/file/upload', method: 'post', data, ...config, headers: { 'Content-Type': 'multipart/form-data' } })

// =============================================》app

export const getAppList = (params: { kb_id: string }): Promise<AppListItem[]> =>
  request({ url: 'api/v1/app/list', method: 'get', params })

export const getAppDetail = (params: { id: string, }): Promise<AppDetail> =>
  request({ url: 'api/v1/app/detail', method: 'get', params })

export const createApp = (data: CreateAppFormData): Promise<{ id: string }> =>
  request({ url: 'api/v1/app', method: 'post', data })

export const deleteApp = (params: { id: string }): Promise<void> =>
  request({ url: 'api/v1/app', method: 'delete', params })

export const updateAppDetail = (params: { id: string, }, app: UpdateAppDetailData): Promise<void> =>
  request({ url: 'api/v1/app', method: 'put', params, data: app })

// =============================================》model

export const getModelNameList = (data: GetModelNameData): Promise<{ models: { model: string }[] }> =>
  request({ url: 'api/v1/model/provider/supported', method: 'post', data })

export const testModel = (data: CheckModelData): Promise<{ error: string }> =>
  request({ url: 'api/v1/model/check', method: 'post', data })

export const getModelList = (): Promise<ModelListItem[]> =>
  request({ url: 'api/v1/model/list', method: 'get' })

export const createModel = (data: CreateModelData): Promise<{ id: string }> =>
  request({ url: 'api/v1/model', method: 'post', data })

export const deleteModel = (params: { id: string, }): Promise<void> =>
  request({ url: 'api/v1/model', method: 'delete', params })

export const updateModel = (data: UpdateModelData): Promise<void> =>
  request({ url: 'api/v1/model', method: 'put', data })

export const updateModelActivate = (data: { model_id: string }): Promise<void> =>
  request({ url: 'api/v1/model/activate', method: 'post', data })

// =============================================》share

export const getAppLink = (params: { link: string }): Promise<AppDetail> =>
  request({ url: 'share/v1/app/link', method: 'get', params })

// =============================================》conversation

export const getConversationList = (params: GetConversationListData): Promise<ResposeList<ConversationListItem>> =>
  request({ url: 'api/v1/conversation', method: 'get', params })

export const getConversationDetail = (params: { id: string }): Promise<ConversationDetail> =>
  request({ url: 'api/v1/conversation/detail', method: 'get', params })
