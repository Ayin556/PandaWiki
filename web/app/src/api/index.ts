import { KBDetail, NodeDetail, NodeListItem } from '@/assets/type';

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  code?: number;
}

interface ApiClientConfig {
  kb_id?: string;
  headers?: Record<string, string>;
  cache?: RequestCache;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
  }

  // 创建SSE客户端（用于聊天）
  createSSEClient(kb_id: string) {
    return {
      url: `${this.baseURL}/share/v1/chat/message`,
      headers: {
        'Content-Type': 'application/json',
        'x-kb-id': kb_id,
      },
    };
  }

  // 服务端专用方法 - 带cookie的请求
  async serverRequest<T>(
    url: string,
    options: RequestInit = {},
    config: ApiClientConfig & { authToken?: string } = {}
  ): Promise<{ data?: T; status: number; error?: string }> {
    const { kb_id = '', headers = {}, cache, authToken } = config;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-kb-id': kb_id,
      'X-Simple-Auth-Password': authToken || '',
      ...headers,
    };
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: requestHeaders,
        ...(cache && { cache }),
      });
      if (!response.ok) {
        return { status: response.status, error: `HTTP error! status: ${response.status}` };
      }
      const result = await response.json();
      return { data: result.data, status: response.status };
    } catch (error) {
      return { status: 500, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 服务端获取知识库信息
  async serverGetKBInfo(kb_id: string, authToken?: string): Promise<{ data?: KBDetail; status: number; error?: string }> {
    return this.serverRequest(`/share/v1/app/web/info`, {
      method: 'GET',
    }, {
      kb_id,
      authToken,
      cache: 'no-store',
    });
  }

  // 服务端获取节点列表
  async serverGetNodeList(
    kb_id: string,
    authToken?: string,
    origin: string = ''
  ): Promise<{ data?: NodeListItem[]; status: number; error?: string }> {
    return this.serverRequest(origin + `/share/v1/node/list`, {
      method: 'GET',
    }, {
      kb_id,
      authToken,
    });
  }

  // 服务端获取节点详情
  async serverGetNodeDetail(id: string, kb_id: string, authToken?: string, origin: string = ''): Promise<{ data?: NodeDetail; status: number; error?: string }> {
    return this.serverRequest(origin + `/share/v1/node/detail?id=${id}`, {
      method: 'GET',
    }, {
      kb_id,
      authToken,
    });
  }
}

export const apiClient = new ApiClient();
