import request from './request';
import {
  ConversationDistributionItem,
  HotDocsItem,
  RefererHostItem,
  StatInstantPageItme,
  StatTypeItem,
  TrendData,
  UpdateAppDetailData,
  UpdateKnowledgeBaseData,
} from './type';

export type * from './type';

// =============================================》knowledge base

export const updateKnowledgeBase = (
  data: Partial<UpdateKnowledgeBaseData>,
): Promise<void> =>
  request({ url: 'api/v1/knowledge_base/detail', method: 'put', data });

// =============================================》file

export const uploadFile = (
  data: FormData,
  config?: {
    onUploadProgress?: (event: { progress: number }) => void;
    abortSignal?: AbortSignal;
  },
): Promise<{ key: string }> =>
  request({
    url: 'api/v1/file/upload',
    method: 'post',
    data,
    onUploadProgress: config?.onUploadProgress
      ? progressEvent => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          config.onUploadProgress?.({ progress });
        }
      : undefined,
    signal: config?.abortSignal,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// =============================================》app

export const updateAppDetail = (
  params: { id: string },
  app: UpdateAppDetailData,
): Promise<void> =>
  request({ url: 'api/v1/app', method: 'put', params, data: app });

// =============================================》stat

export const statInstantPage = (params: {
  kb_id: string;
}): Promise<StatInstantPageItme[]> =>
  request({ url: 'api/v1/stat/instant_pages', method: 'get', params });

export const statInstantCount = (params: {
  kb_id: string;
}): Promise<(Omit<TrendData, 'name'> & { time: string })[]> =>
  request({ url: 'api/v1/stat/instant_count', method: 'get', params });

export const statGeoCount = (params: {
  kb_id: string;
}): Promise<Record<string, number>> =>
  request({ url: 'api/v1/stat/geo_count', method: 'get', params });

export const statCount = (params: { kb_id: string }): Promise<StatTypeItem> =>
  request({ url: 'api/v1/stat/count', method: 'get', params });

export const statBrowsers = (params: {
  kb_id: string;
}): Promise<{ browser: TrendData[]; os: TrendData[] }> =>
  request({ url: 'api/v1/stat/browsers', method: 'get', params });

export const statHotPages = (params: {
  kb_id: string;
}): Promise<HotDocsItem[]> =>
  request({ url: 'api/v1/stat/hot_pages', method: 'get', params });

export const statRefererHosts = (params: {
  kb_id: string;
}): Promise<RefererHostItem[]> =>
  request({ url: 'api/v1/stat/referer_hosts', method: 'get', params });

export const statConversationDistribution = (params: {
  kb_id: string;
}): Promise<ConversationDistributionItem[]> =>
  request({
    url: 'api/v1/stat/conversation_distribution',
    method: 'get',
    params,
  });
