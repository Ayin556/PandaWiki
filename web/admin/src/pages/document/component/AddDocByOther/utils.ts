import { DataItem, DocumentStatus } from './types';

/**
 * 检查状态是否为加载中
 */
export const isLoadingStatus = (status: DocumentStatus): boolean => {
  return ['uploading', 'pulling', 'creating'].includes(status);
};

/**
 * 检查状态是否为错误状态
 */
export const isErrorStatus = (status: DocumentStatus): boolean => {
  return ['upload-error', 'pull-error', 'error'].includes(status);
};

/**
 * 检查状态是否为成功状态
 */
export const isSuccessStatus = (status: DocumentStatus): boolean => {
  return status === 'success';
};

/**
 * 检查状态是否为完成状态（包括成功和各种 done）
 */
export const isDoneStatus = (status: DocumentStatus): boolean => {
  return ['upload-done', 'pull-done', 'success'].includes(status);
};

/**
 * 获取状态显示文本
 */
export const getStatusText = (status: DocumentStatus): string => {
  const statusTextMap: Record<DocumentStatus, string> = {
    default: '待处理',
    waiting: '等待中',
    uploading: '上传中',
    'upload-done': '上传完成',
    'upload-error': '上传失败',
    pulling: '拉取中',
    'pull-done': '拉取完成',
    'pull-error': '拉取失败',
    creating: '创建中',
    success: '成功',
    error: '失败',
  };

  return statusTextMap[status] || status;
};

/**
 * 验证表单数据
 */
export const validateFormData = (
  formData: {
    url?: string;
    app_id?: string;
    app_secret?: string;
    user_access_token?: string;
  },
  type: string,
): { isValid: boolean; errorMessage?: string } => {
  if (['URL', 'RSS', 'Sitemap', 'Notion'].includes(type)) {
    if (!formData.url?.trim()) {
      return { isValid: false, errorMessage: '请输入有效的地址' };
    }
  }

  if (type === 'Feishu') {
    if (!formData.app_id?.trim()) {
      return { isValid: false, errorMessage: '请输入 App ID' };
    }
    if (!formData.app_secret?.trim()) {
      return { isValid: false, errorMessage: '请输入 Client Secret' };
    }
    if (!formData.user_access_token?.trim()) {
      return { isValid: false, errorMessage: '请输入 User Access Token' };
    }
  }

  return { isValid: true };
};

/**
 * 过滤可操作的文档项
 */
export const filterActionableItems = (
  items: DataItem[],
  checkedIds: string[],
  targetStatus: DocumentStatus | DocumentStatus[],
): DataItem[] => {
  const statusArray = Array.isArray(targetStatus)
    ? targetStatus
    : [targetStatus];

  return items.filter(
    item => checkedIds.includes(item.uuid) && statusArray.includes(item.status),
  );
};

/**
 * 生成唯一ID (简单版本，实际项目中可能需要更复杂的实现)
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 批量执行异步任务（带并发控制）
 */
export const executeTasksInBatches = async <T, R>(
  items: T[],
  handler: (item: T) => Promise<R>,
  batchSize: number = 5,
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(item => handler(item)),
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Task ${i + index} failed:`, result.reason);
      }
    });
  }

  return results;
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
