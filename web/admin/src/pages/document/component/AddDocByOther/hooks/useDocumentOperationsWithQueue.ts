import { ImportDocType, uploadFile } from '@/api';
import {
  getApiV1CrawlerResult,
  postApiV1CrawlerConfluenceParse,
  postApiV1CrawlerConfluenceScrape,
  postApiV1CrawlerEpubParse,
  postApiV1CrawlerFeishuGetDoc,
  postApiV1CrawlerMindocParse,
  postApiV1CrawlerMindocScrape,
  postApiV1CrawlerNotionScrape,
  postApiV1CrawlerRssScrape,
  postApiV1CrawlerScrape,
  postApiV1CrawlerSitemapScrape,
  postApiV1CrawlerSiyuanParse,
  postApiV1CrawlerSiyuanScrape,
  postApiV1CrawlerWikijsParse,
  postApiV1CrawlerWikijsScrape,
  postApiV1Node,
} from '@/request';
import { useCallback } from 'react';
import { DOCUMENT_STATUS } from '../constants';
import { DataItem } from '../types';
import { QueueTask, useRequestQueue } from './useRequestQueue';

interface UseDocumentOperationsWithQueueProps {
  type: ImportDocType;
  kb_id: string;
  typeId: string;
  parentId: string | null;
  updateItemStatus: (
    uuid: string,
    updates: Partial<DataItem> | ((item: DataItem) => Partial<DataItem>),
  ) => void;
  formData?: {
    app_id?: string;
    app_secret?: string;
    user_access_token?: string;
  };
  onParseSuccess?: (data: { typeId: string; docs: DataItem[] }) => void;
}

/**
 * 带队列管理的文档操作 Hook
 * 集成了请求队列和中断功能
 */
export const useDocumentOperationsWithQueue = ({
  type,
  kb_id,
  typeId,
  parentId,
  updateItemStatus,
  formData,
  onParseSuccess,
}: UseDocumentOperationsWithQueueProps) => {
  // 初始化请求队列
  const requestQueue = useRequestQueue(5);

  /**
   * 包装 Promise 使其支持 AbortSignal
   */
  const makeAbortable = <T>(
    promiseFunc: () => Promise<T>,
    signal: AbortSignal,
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // 如果已经中断，直接 reject
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      // 监听中断事件
      const onAbort = () => {
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort);

      // 执行 Promise
      promiseFunc()
        .then(result => {
          signal.removeEventListener('abort', onAbort);
          if (!signal.aborted) {
            resolve(result);
          }
        })
        .catch(error => {
          signal.removeEventListener('abort', onAbort);
          reject(error);
        });
    });
  };

  /**
   * 上传文件（支持中断）
   */
  const uploadFileWithAbort = useCallback(
    (item: DataItem, signal: AbortSignal) => {
      return makeAbortable(async () => {
        // 设置为上传中
        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.UPLOADING,
          progress: 0,
        });

        const formData = new FormData();
        formData.append('file', item.file!);
        formData.append('kb_id', kb_id);

        const response = await uploadFile(formData, {
          abortSignal: signal, // 传递 signal 给 axios
          onUploadProgress: event => {
            const progress = event.progress || 0;
            updateItemStatus(item.uuid, {
              progress: Math.round(progress),
            });
          },
        });

        // 上传成功，设置为上传完成
        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.UPLOAD_DONE,
          progress: 100,
        });

        return response;
      }, signal);
    },
    [kb_id, updateItemStatus],
  );

  /**
   * 上传文件获取 URL（用于非中断场景）
   */
  const uploadFileToGetUrl = useCallback(
    async (file: File, onProgress?: (progress: number) => void) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kb_id', kb_id);

      const response = await uploadFile(formData, {
        onUploadProgress: event => {
          const progress = Math.round(event.progress || 0);
          onProgress?.(progress);
        },
      });

      return response;
    },
    [kb_id],
  );

  /**
   * 拉取数据 - RSS/Sitemap（支持中断）
   */
  const fetchRssOrSitemapData = useCallback(
    (item: DataItem, signal: AbortSignal) => {
      return makeAbortable(async () => {
        updateItemStatus(item.uuid, { status: DOCUMENT_STATUS.PULLING });

        const scrapeFunc =
          type === 'RSS'
            ? postApiV1CrawlerRssScrape
            : postApiV1CrawlerSitemapScrape;

        const res = await scrapeFunc(
          {
            url: item.uuid,
            id: typeId,
            kb_id,
          },
          { signal }, // 传递 signal
        );

        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.PULL_DONE,
          content: res.content || '',
        });

        return res;
      }, signal);
    },
    [type, typeId, kb_id, updateItemStatus],
  );

  /**
   * 拉取数据 - 解析类型（支持中断）
   */
  const fetchParseTypeData = useCallback(
    (item: DataItem, signal: AbortSignal) => {
      return makeAbortable(async () => {
        updateItemStatus(item.uuid, { status: DOCUMENT_STATUS.PULLING });

        const funcMap = {
          Confluence: postApiV1CrawlerConfluenceScrape,
          'Wiki.js': postApiV1CrawlerWikijsScrape,
          Siyuan: postApiV1CrawlerSiyuanScrape,
          MinDoc: postApiV1CrawlerMindocScrape,
          Notion: postApiV1CrawlerNotionScrape,
        };

        const scrapeFunc = funcMap[type as keyof typeof funcMap];
        if (!scrapeFunc) {
          throw new Error(`Unsupported type: ${type}`);
        }

        const res = await scrapeFunc(
          {
            kb_id,
            doc_id: item.id,
            id: typeId,
          },
          { signal },
        );

        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.PULL_DONE,
          content: res.content || '',
        });

        return res;
      }, signal);
    },
    [type, typeId, kb_id, updateItemStatus],
  );

  /**
   * 拉取数据 - Feishu（支持中断）
   */
  const fetchFeishuData = useCallback(
    (item: DataItem, signal: AbortSignal) => {
      return makeAbortable(async () => {
        updateItemStatus(item.uuid, { status: DOCUMENT_STATUS.PULLING });

        const res = await postApiV1CrawlerFeishuGetDoc(
          {
            kb_id,
            doc_id: item.id,
            id: item.id,
            space_id: item.space_id,
            file_type: item.file_type,
          },
          { signal },
        );

        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.PULL_DONE,
          content: res.content || '',
        });

        return res;
      }, signal);
    },
    [kb_id, updateItemStatus],
  );

  /**
   * 创建文档（支持中断）
   */
  const createDocument = useCallback(
    (item: DataItem, signal: AbortSignal) => {
      return makeAbortable(async () => {
        updateItemStatus(item.uuid, { status: DOCUMENT_STATUS.CREATING });

        const result = await postApiV1Node(
          {
            name: item.title || '',
            content: item.content || '',
            parent_id: parentId || undefined,
            type: 2,
            kb_id,
          },
          { signal },
        );
        updateItemStatus(item.uuid, { status: DOCUMENT_STATUS.SUCCESS });
        return result;
      }, signal);
    },
    [kb_id, parentId, updateItemStatus],
  );

  /**
   * 批量上传文件（使用队列）
   */
  const batchUploadFiles = useCallback(
    (items: DataItem[]) => {
      // 1. 先批量更新所有状态为 uploading
      items.forEach(item => {
        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.UPLOADING,
          progress: 0,
        });
      });

      // 2. 创建队列任务
      const tasks: QueueTask[] = items.map(item => ({
        id: item.uuid,
        execute: async (signal: AbortSignal) => {
          // 执行上传，但不在这里设置 uploading 状态（已经在上面设置了）
          const formData = new FormData();
          formData.append('file', item.file!);
          formData.append('kb_id', kb_id);

          const response = await uploadFile(formData, {
            abortSignal: signal,
            onUploadProgress: event => {
              const progress = event.progress || 0;
              updateItemStatus(item.uuid, {
                progress: Math.round(progress),
              });
            },
          });

          // 对于 OfflineFile 和 Epub 类型，需要调用接口获取 task_id
          if (type === 'OfflineFile') {
            // 构建文件 URL
            const fileUrl = response.key.startsWith('/static-file/')
              ? response.key
              : `/static-file/${response.key}`;

            const scrapeResp = await postApiV1CrawlerScrape(
              {
                url: fileUrl,
                kb_id,
              },
              { signal },
            );

            // 更新状态并保存 task_id
            updateItemStatus(item.uuid, {
              status: DOCUMENT_STATUS.UPLOAD_DONE,
              progress: 100,
              id: scrapeResp.task_id || '',
            });
          } else if (type === 'Epub') {
            // Epub 类型需要调用 EpubParse 接口
            const epubResp = await postApiV1CrawlerEpubParse(
              {
                kb_id,
                key: response.key,
                filename: response.filename,
              },
              { signal },
            );

            // 更新状态并保存 task_id
            updateItemStatus(item.uuid, {
              status: DOCUMENT_STATUS.UPLOAD_DONE,
              progress: 100,
              id: epubResp.task_id || '',
            });
          } else {
            // 成功后更新状态
            updateItemStatus(item.uuid, {
              status: DOCUMENT_STATUS.UPLOAD_DONE,
              progress: 100,
            });
          }

          return response;
        },
        onError: (error: Error) => {
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.UPLOAD_ERROR,
            progress: 0,
          });
          console.error(`上传失败: ${item.title}`, error);
        },
        onAbort: () => {
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.UPLOAD_ERROR,
            progress: 0,
          });
        },
      }));

      // 3. 将任务加入队列
      requestQueue.addTasks(tasks);
    },
    [type, kb_id, updateItemStatus, requestQueue],
  );

  /**
   * 批量拉取数据（使用队列）
   */
  const batchPullData = useCallback(
    (items: DataItem[]) => {
      // 1. 先批量更新所有状态为 pulling
      items.forEach(item => {
        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.PULLING,
        });
      });

      // 2. 创建队列任务
      const tasks: QueueTask[] = items.map(item => {
        let executeFunc: (signal: AbortSignal) => Promise<any>;

        if (['RSS', 'Sitemap'].includes(type)) {
          executeFunc = async (signal: AbortSignal) => {
            // 执行拉取（不再设置 pulling 状态，已在上面设置）
            const scrapeFunc =
              type === 'RSS'
                ? postApiV1CrawlerRssScrape
                : postApiV1CrawlerSitemapScrape;

            const res = await scrapeFunc(
              {
                url: item.uuid,
                id: typeId,
                kb_id,
              },
              { signal },
            );

            // 成功后更新状态
            updateItemStatus(item.uuid, {
              status: DOCUMENT_STATUS.PULL_DONE,
              content: res.content || '',
            });

            return res;
          };
        } else if (
          ['Confluence', 'Wiki.js', 'Siyuan', 'MinDoc', 'Notion'].includes(type)
        ) {
          executeFunc = async (signal: AbortSignal) => {
            const funcMap = {
              Confluence: postApiV1CrawlerConfluenceScrape,
              'Wiki.js': postApiV1CrawlerWikijsScrape,
              Siyuan: postApiV1CrawlerSiyuanScrape,
              MinDoc: postApiV1CrawlerMindocScrape,
              Notion: postApiV1CrawlerNotionScrape,
            };

            const scrapeFunc = funcMap[type as keyof typeof funcMap];
            if (!scrapeFunc) {
              throw new Error(`Unsupported type: ${type}`);
            }

            const res = await scrapeFunc(
              {
                kb_id,
                doc_id: item.id,
                id: typeId,
              },
              { signal },
            );

            updateItemStatus(item.uuid, {
              status: DOCUMENT_STATUS.PULL_DONE,
              content: res.content || '',
            });

            return res;
          };
        } else if (type === 'Feishu') {
          executeFunc = async (signal: AbortSignal) => {
            const res = await postApiV1CrawlerFeishuGetDoc(
              {
                kb_id,
                doc_id: item.id,
                id: item.id,
                space_id: item.space_id,
                file_type: item.file_type,
              },
              { signal },
            );

            updateItemStatus(item.uuid, {
              status: DOCUMENT_STATUS.PULL_DONE,
              content: res.content || '',
            });

            return res;
          };
        } else if (['OfflineFile', 'Epub', 'URL', 'Yuque'].includes(type)) {
          // 需要轮询结果的类型
          executeFunc = async (signal: AbortSignal) => {
            // 轮询获取结果
            const pollResult = async (): Promise<any> => {
              // 检查是否已中断
              if (signal.aborted) {
                throw new DOMException('Aborted', 'AbortError');
              }

              const res = await getApiV1CrawlerResult(
                { task_id: item.id },
                { signal },
              );

              if (res.status === 'completed') {
                updateItemStatus(item.uuid, {
                  status: DOCUMENT_STATUS.PULL_DONE,
                  content: res.content || '',
                });
                return res;
              } else if (res.status === 'failed') {
                throw new Error('拉取失败');
              } else {
                // 等待 2 秒后继续轮询
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(resolve, 2000);
                  signal.addEventListener('abort', () => {
                    clearTimeout(timeout);
                    reject(new DOMException('Aborted', 'AbortError'));
                  });
                });
                return pollResult();
              }
            };

            return pollResult();
          };
        } else {
          // 其他类型的处理
          executeFunc = async (signal: AbortSignal) => {
            throw new Error(`Unsupported type for batch pull: ${type}`);
          };
        }

        return {
          id: item.uuid,
          execute: executeFunc,
          onError: (error: Error) => {
            updateItemStatus(item.uuid, {
              status: DOCUMENT_STATUS.PULL_ERROR,
            });
            console.error(`拉取失败: ${item.title}`, error);
          },
          onAbort: () => {
            updateItemStatus(item.uuid, {
              status: DOCUMENT_STATUS.PULL_ERROR,
            });
          },
        };
      });

      // 3. 将任务加入队列
      requestQueue.addTasks(tasks);
    },
    [type, typeId, kb_id, updateItemStatus, requestQueue],
  );

  /**
   * 批量创建文档（使用队列）
   */
  const batchCreateDocuments = useCallback(
    (items: DataItem[]) => {
      // 1. 先批量更新所有状态为 creating
      items.forEach(item => {
        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.CREATING,
        });
      });

      // 2. 创建队列任务
      const tasks: QueueTask[] = items.map(item => ({
        id: item.uuid,
        execute: async (signal: AbortSignal) => {
          // 执行创建（不再设置 creating 状态，已在上面设置）
          const result = await postApiV1Node(
            {
              name: item.title || '',
              content: item.content || '',
              parent_id: parentId || undefined,
              type: 2,
              kb_id,
            },
            { signal },
          );
          // 成功后更新状态
          updateItemStatus(item.uuid, { status: DOCUMENT_STATUS.SUCCESS });
          return result;
        },
        onError: (error: Error) => {
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.ERROR,
          });
          console.error(`创建文档失败: ${item.title}`, error);
        },
        onAbort: () => {
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.ERROR,
          });
        },
      }));

      // 3. 将任务加入队列
      requestQueue.addTasks(tasks);
    },
    [kb_id, parentId, updateItemStatus, requestQueue],
  );

  /**
   * 批量抓取 URL（使用队列）
   */
  const batchScrapeUrls = useCallback(
    (items: DataItem[]) => {
      // 1. 先批量更新所有状态为 uploading
      items.forEach(item => {
        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.UPLOADING,
        });
      });

      // 2. 创建队列任务
      const tasks: QueueTask[] = items.map(item => ({
        id: item.uuid,
        execute: async (signal: AbortSignal) => {
          // 调用抓取 API
          const result = await postApiV1CrawlerScrape(
            {
              url: item.uuid,
              kb_id,
            },
            { signal },
          );
          // 成功后更新状态和数据
          updateItemStatus(item.uuid, {
            id: result.task_id || '',
            title: result.title || item.uuid,
            status: DOCUMENT_STATUS.UPLOAD_DONE,
          });

          return result;
        },
        onError: (error: Error) => {
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.UPLOAD_ERROR,
          });
        },
        onAbort: () => {
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.UPLOAD_ERROR,
          });
        },
      }));

      // 3. 将任务加入队列
      requestQueue.addTasks(tasks);
    },
    [kb_id, updateItemStatus, requestQueue],
  );

  /**
   * 批量上传并解析文件（Confluence、Wiki.js、Siyuan、MinDoc）
   * 这些类型上传后会解析并返回文档列表
   */
  const batchUploadAndParseFiles = useCallback(
    (items: DataItem[]) => {
      // 1. 先批量更新所有状态为 uploading
      items.forEach(item => {
        updateItemStatus(item.uuid, {
          status: DOCUMENT_STATUS.UPLOADING,
          progress: 0,
        });
      });

      // 2. 创建队列任务
      const tasks: QueueTask[] = items.map(item => ({
        id: item.uuid,
        execute: async (signal: AbortSignal) => {
          // 确定解析函数
          const parseFuncMap = {
            Confluence: postApiV1CrawlerConfluenceParse,
            'Wiki.js': postApiV1CrawlerWikijsParse,
            Siyuan: postApiV1CrawlerSiyuanParse,
            MinDoc: postApiV1CrawlerMindocParse,
          };

          const parseFunc = parseFuncMap[type as keyof typeof parseFuncMap];
          if (!parseFunc) {
            throw new Error(`Unsupported type: ${type}`);
          }

          // 上传并解析文件
          const response = await parseFunc(
            { kb_id, file: item.file! },
            {
              signal,
              onUploadProgress: event => {
                const progress = Math.round((event?.progress || 0) * 100);
                updateItemStatus(item.uuid, {
                  progress,
                });
              },
            },
          );

          // 解析成功，更新状态
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.UPLOAD_DONE,
            progress: 100,
          });

          // 调用回调，让父组件更新列表
          if (onParseSuccess && response.docs) {
            const docs: DataItem[] = (response.docs || []).map(it => ({
              id: it.id!,
              title: it.title!,
              content: '',
              uuid: crypto.randomUUID(),
              status: 'upload-done' as const,
              type: 'file' as const,
            }));

            onParseSuccess({
              typeId: response.id!,
              docs,
            });
          }

          return response;
        },
        onError: (error: Error) => {
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.UPLOAD_ERROR,
            progress: 0,
          });
          console.error(`上传解析失败: ${item.title}`, error);
        },
        onAbort: () => {
          updateItemStatus(item.uuid, {
            status: DOCUMENT_STATUS.UPLOAD_ERROR,
            progress: 0,
          });
        },
      }));

      // 3. 将任务加入队列
      requestQueue.addTasks(tasks);
    },
    [type, kb_id, updateItemStatus, onParseSuccess, requestQueue],
  );

  return {
    // 队列批量操作（单个操作也使用队列，传入单个元素的数组）
    batchUploadFiles,
    batchUploadAndParseFiles,
    batchPullData,
    batchCreateDocuments,
    batchScrapeUrls,

    // 特殊工具函数
    uploadFileToGetUrl, // 用于 Yuque 类型的文件上传

    // 队列控制
    abortTask: requestQueue.abortTask,
    abortTasks: requestQueue.abortTasks,
    abortAll: requestQueue.abortAll,
    getQueueInfo: requestQueue.getQueueInfo,
    isTaskRunning: requestQueue.isTaskRunning,
    taskStatuses: requestQueue.taskStatuses,
  };
};

export default useDocumentOperationsWithQueue;
