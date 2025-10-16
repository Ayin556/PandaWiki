import { ImportDocProps, ImportDocType, uploadFile } from '@/api';
import Upload from '@/components/UploadFile/Drag';
import {
  getApiV1CrawlerResult,
  postApiV1CrawlerConfluenceParse,
  postApiV1CrawlerConfluenceScrape,
  postApiV1CrawlerEpubParse,
  postApiV1CrawlerFeishuGetDoc,
  postApiV1CrawlerFeishuListDoc,
  postApiV1CrawlerFeishuListSpaces,
  postApiV1CrawlerFeishuSearchWiki,
  postApiV1CrawlerMindocParse,
  postApiV1CrawlerMindocScrape,
  postApiV1CrawlerNotionParse,
  postApiV1CrawlerNotionScrape,
  postApiV1CrawlerResults,
  postApiV1CrawlerRssParse,
  postApiV1CrawlerRssScrape,
  postApiV1CrawlerScrape,
  postApiV1CrawlerSitemapParse,
  postApiV1CrawlerSitemapScrape,
  postApiV1CrawlerSiyuanParse,
  postApiV1CrawlerSiyuanScrape,
  postApiV1CrawlerWikijsParse,
  postApiV1CrawlerWikijsScrape,
  postApiV1CrawlerYuqueParse,
  postApiV1Node,
} from '@/request';
import { useAppSelector } from '@/store';
import { formatByte } from '@/utils';
import { Ellipsis, Icon, message, Modal } from '@ctzhian/ui';
import {
  alpha,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  TextField,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

type DataItem = {
  id: string;
  uuid: string;
  title: string;
  file?: File;
  content?: string;
  progress?: number;
  type: 'file' | 'other' | 'folder';
  space_id?: string;
  file_type?: string;
  open?: boolean;
  status:
    | 'default'
    | 'waiting' // 默认
    | 'uploading'
    | 'upload-done'
    | 'upload-error' // 文件
    | 'pulling'
    | 'pull-done'
    | 'pull-error' // 拉取数据
    | 'creating'
    | 'success'
    | 'error'; // 创建文档
};

type FormData = {
  url?: string;
  app_id?: string;
  app_secret?: string;
  user_access_token?: string;
};

const AddDocByOther = ({
  type,
  open,
  refresh,
  onCancel,
  parentId = null,
}: ImportDocProps & { type: ImportDocType }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataItem[]>([]);
  const [folderChildrenData, setFolderChildrenData] = useState<DataItem[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const { kb_id } = useAppSelector(state => state.config);
  const [formData, setFormData] = useState<FormData>({});
  const [totalCount, setTotalCount] = useState({
    loading: 0,
    fail: 0,
    default: 0,
    waiting: 0,
    uploading: 0,
    pulling: 0,
    creating: 0,
    'upload-done': 0,
    'pull-done': 0,
    success: 0,
    'upload-error': 0,
    'pull-error': 0,
    error: 0,
  });

  const UploadFileType = [
    'OfflineFile',
    'Epub',
    'Wiki.js',
    'Yuque',
    'Siyuan',
    'MinDoc',
    'Confluence',
  ] as const;
  const isUploadFileType = UploadFileType.includes(type as any);

  const [typeId, setTypeId] = useState<string>('');

  const TypeList: Record<
    ImportDocType,
    {
      label: string;
      okText?: string;
      accept?: string;
      usage?: string;
    }
  > = {
    OfflineFile: {
      label: '通过离线文件导入',
      okText: '导入文件',
      accept: '.txt, .md, .xls, .xlsx, .docx, .pdf, .html, .pptx',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%E7%A6%BB%E7%BA%BF%E6%96%87%E4%BB%B6%E5%AF%BC%E5%85%A5',
    },
    URL: {
      label: '通过 URL 导入',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%20URL%20%E5%AF%BC%E5%85%A5',
    },
    RSS: {
      label: '通过 RSS 导入',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%20RSS%20%E5%AF%BC%E5%85%A5',
    },
    Sitemap: {
      label: '通过 Sitemap 导入',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%20SiteMap%20%E5%AF%BC%E5%85%A5',
    },
    Notion: {
      label: '通过 Notion 导入',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%20Notion%20%E5%AF%BC%E5%85%A5',
    },
    Epub: {
      label: '通过 Epub 导入',
      accept: '.epub',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%20Epub%20%E5%AF%BC%E5%85%A5',
    },
    'Wiki.js': {
      label: '通过 Wiki.js 导入',
      accept: '.zip',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%20Wiki.js%20%E5%AF%BC%E5%85%A5',
    },
    Yuque: {
      label: '通过语雀导入',
      accept: '.lakebook',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%E8%AF%AD%E9%9B%80%E5%AF%BC%E5%85%A5',
    },
    Siyuan: {
      label: '通过思源笔记导入',
      accept: '.zip',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%E6%80%9D%E6%BA%90%E7%AC%94%E8%AE%B0%E5%AF%BC%E5%85%A5',
    },
    MinDoc: {
      label: '通过 MinDoc 导入',
      accept: '.zip',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%20MinDoc%20%E5%AF%BC%E5%85%A5',
    },
    Feishu: {
      label: '通过飞书文档导入',
      okText: '拉取知识库',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%E9%A3%9E%E4%B9%A6%E6%96%87%E6%A1%A3%E5%AF%BC%E5%85%A5',
    },
    Confluence: {
      label: '通过 Confluence 导入',
      accept: '.zip',
      usage:
        'https://pandawiki.docs.baizhi.cloud/node/01976929-0e76-77a9-aed9-842e60933464#%E9%80%9A%E8%BF%87%20Confluence%20%E5%AF%BC%E5%85%A5',
    },
  };

  // 本地获取文件初始化列表
  const handleInitFiles = (uploadFiles: File[]) => {
    const newData: DataItem[] = uploadFiles.map(file => ({
      type: 'file',
      title: file.name.split('.')[0],
      file,
      id: '',
      content: '',
      uuid: uuidv4(),
      progress: 0,
      status: 'default',
    }));
    if (['OfflineFile', 'Epub'].includes(type)) {
      setChecked(prev => [...prev, ...newData.map(it => it.uuid)]);
      setData(prev => [...prev, ...newData]);
    } else {
      setChecked(newData.map(it => it.uuid));
      setData(newData);
    }
  };

  // 上传文件获取 url
  const getUrlByUploadFile = async (
    file: File,
    onProgress: (progress: number) => void,
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kb_id', kb_id);
    const response = await uploadFile(formData, {
      onUploadProgress: event => onProgress(event.progress),
    });
    return response;
  };

  // 处理表单提交
  const handleSubmitForm = async () => {
    setLoading(true);
    if (['URL', 'RSS', 'Sitemap', 'Notion'].includes(type)) {
      if (!formData.url) {
        message.error('表单不能为空');
        setLoading(false);
        return;
      }
    }
    if (['Feishu'].includes(type)) {
      if (
        !formData.app_id ||
        !formData.app_secret ||
        !formData.user_access_token
      ) {
        message.error('表单不能为空');
        setLoading(false);
        return;
      }
    }
    try {
      switch (type) {
        case 'URL':
          const urls = formData.url?.split('\n').filter(u => u.trim()) || [];
          setData(
            urls.map(url => ({
              id: '',
              title: '',
              content: '',
              uuid: url,
              status: 'uploading',
              type: 'other',
            })),
          );
          setChecked(urls);
          for (const url of urls) {
            const urlResp = await postApiV1CrawlerScrape({ url, kb_id });
            setData(prev =>
              prev.map(item =>
                item.uuid === url
                  ? {
                      ...item,
                      id: urlResp.task_id!,
                      title: urlResp.title || item.uuid,
                      status: 'upload-done',
                    }
                  : item,
              ),
            );
          }
          break;
        case 'RSS':
          const rssResp = await postApiV1CrawlerRssParse({
            url: formData.url!,
          });
          setTypeId(rssResp.id!);
          setData(
            (rssResp.list || []).map(item => ({
              id: '',
              title: item.title!,
              content: item.desc!,
              uuid: item.url!,
              status: 'upload-done',
              type: 'other',
            })),
          );
          setChecked((rssResp.list || []).map(item => item.url!));
          break;
        case 'Sitemap':
          const sitemapResp = await postApiV1CrawlerSitemapParse({
            url: formData.url!,
          });
          setTypeId(sitemapResp.id!);
          setData(
            (sitemapResp.list || []).map(item => ({
              id: '',
              title: item.title!,
              content: '',
              uuid: item.url!,
              status: 'upload-done',
              type: 'other',
            })),
          );
          setChecked((sitemapResp.list || []).map(item => item.url!));
          break;
        case 'Notion':
          const notionResp = await postApiV1CrawlerNotionParse({
            integration: formData.url!,
          });
          setTypeId(notionResp.id!);
          const newData: DataItem[] = (notionResp.docs || []).map(item => ({
            id: item.id!,
            title: item.title!,
            content: '',
            uuid: uuidv4(),
            status: 'upload-done',
            type: 'other',
          }));
          setData(newData);
          setChecked(newData.map(item => item.uuid));
          break;
        case 'Feishu':
          const reqData = {
            app_id: formData.app_id!,
            app_secret: formData.app_secret!,
            user_access_token: formData.user_access_token!,
          };
          const feishuResp = await Promise.all([
            postApiV1CrawlerFeishuListSpaces(reqData),
            postApiV1CrawlerFeishuListDoc(reqData),
          ]);
          const feishuData: DataItem[] = [];
          if (feishuResp[0].length > 0) {
            const spaceData: DataItem[] = feishuResp[0].map(item => ({
              id: item.space_id!,
              space_id: item.space_id!,
              uuid: uuidv4(),
              type: 'folder',
              title: item.name!,
              status: 'default',
              open: true,
            }));
            feishuData.push(...spaceData);
          }
          if (feishuResp[1].length > 0) {
            const docData: DataItem[] = feishuResp[1].map(item => ({
              id: item.id,
              uuid: item.doc_id,
              space_id: item.space_id,
              file_type: item.file_type,
              type: 'other',
              title: item.title!,
              content: '',
              status: 'upload-done',
            }));
            setFolderChildrenData(prev => [...prev, ...docData]);
            feishuData.push({
              id: 'cloud_disk',
              space_id: 'cloud_disk',
              uuid: uuidv4(),
              type: 'folder',
              title: '飞书云盘',
              status: 'default',
              open: true,
            });
          }
          setData(feishuData);
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  // 拉取文件夹文件
  const handleFolderPullData = async (value: DataItem) => {
    setLoading(true);
    try {
      setData(prev =>
        prev.map(item =>
          item.uuid === value.uuid
            ? {
                ...item,
                status: 'uploading',
              }
            : item,
        ),
      );
      const reqData = {
        app_id: formData.app_id!,
        app_secret: formData.app_secret!,
        user_access_token: formData.user_access_token!,
        space_id: value.id,
      };
      const res = await postApiV1CrawlerFeishuSearchWiki(reqData);
      const docs: DataItem[] = (res || []).map(it => ({
        id: it.id!,
        uuid: it.doc_id,
        space_id: it.space_id!,
        file_type: it.file_type!,
        type: 'other',
        title: it.title!,
        content: '',
        status: 'upload-done',
      }));
      setData(prev =>
        prev.map(item =>
          item.uuid === value.uuid
            ? {
                ...item,
                status: 'default',
              }
            : item,
        ),
      );
      setFolderChildrenData(prev => [...prev, ...docs]);
    } catch (error) {
      setData(prev =>
        prev.map(item =>
          item.uuid === value.uuid
            ? {
                ...item,
                status: 'upload-error',
              }
            : item,
        ),
      );
    }
    setLoading(false);
  };

  // 处理单个文件上传
  const handlerUploadFile = async (value: DataItem) => {
    setLoading(true);
    try {
      if (['Confluence', 'Wiki.js', 'Siyuan', 'MinDoc'].includes(type)) {
        setData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'pulling',
                }
              : item,
          ),
        );
        const TypeFunc = {
          Confluence: postApiV1CrawlerConfluenceParse,
          'Wiki.js': postApiV1CrawlerWikijsParse,
          Siyuan: postApiV1CrawlerSiyuanParse,
          MinDoc: postApiV1CrawlerMindocParse,
        };
        const resq = await TypeFunc[type as keyof typeof TypeFunc](
          { kb_id, file: value.file! },
          {
            onUploadProgress: event => {
              setData(prev =>
                prev.map(item =>
                  item.uuid === value.uuid
                    ? {
                        ...item,
                        progress: ((event?.progress || 0) * 100) | 0,
                      }
                    : item,
                ),
              );
            },
          },
        );
        setTypeId(resq.id!);
        const docs: DataItem[] = (resq.docs || []).map(it => ({
          id: it.id!,
          title: it.title!,
          content: '',
          uuid: uuidv4(),
          status: 'upload-done',
          type: 'file',
        }));
        setData(docs);
        setChecked(docs.map(it => it.uuid));
      } else {
        const { key, filename } = await getUrlByUploadFile(
          value.file!,
          progress => {
            setData(prev =>
              prev.map(item =>
                item.uuid === value.uuid
                  ? {
                      ...item,
                      status: 'uploading',
                      progress,
                    }
                  : item,
              ),
            );
          },
        );
        const fileUrl = key.startsWith('/static-file/')
          ? key
          : `/static-file/${key}`;
        switch (type) {
          case 'Epub':
            const EpubResp = await postApiV1CrawlerEpubParse({
              kb_id,
              key,
              filename,
            });
            setData(prev =>
              prev.map(item =>
                item.uuid === value.uuid
                  ? {
                      ...item,
                      status: 'upload-done',
                      progress: 100,
                      id: EpubResp.task_id!,
                    }
                  : item,
              ),
            );
            break;
          case 'Yuque':
            const YuqueResp = await postApiV1CrawlerYuqueParse({
              kb_id,
              key,
              filename,
            });
            if (YuqueResp.list && YuqueResp.list.length > 0) {
              const newData: DataItem[] = YuqueResp.list.map(it => ({
                id: it.task_id!,
                title: it.title!,
                content: '',
                uuid: uuidv4(),
                status: 'upload-done',
                type: 'file',
              }));
              setData(newData);
              setChecked(newData.map(it => it.uuid));
            }
            break;
          case 'OfflineFile':
            const OfflineFileResp = await postApiV1CrawlerScrape({
              url: fileUrl,
              kb_id,
            });
            setData(prev =>
              prev.map(item =>
                item.uuid === value.uuid
                  ? {
                      ...item,
                      status: 'upload-done',
                      progress: 100,
                      id: OfflineFileResp.task_id!,
                    }
                  : item,
              ),
            );
            break;
          default:
            break;
        }
      }
    } catch (error) {
      setData(prev =>
        prev.map(item =>
          item.uuid === value.uuid
            ? {
                ...item,
                progress: 0,
                status: 'upload-error',
              }
            : item,
        ),
      );
    }
    setLoading(false);
  };

  // 批量上传文件
  const handleBatchUploadFile = async () => {
    setLoading(true);
    try {
      await Promise.all(
        data
          .filter(
            item =>
              checked.includes(item.uuid) &&
              (item.status === 'default' || item.status === 'upload-error'),
          )
          .map(item => handlerUploadFile(item)),
      );
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // 解析获取数据
  const handleParseData = async (value: DataItem) => {
    setLoading(true);
    try {
      if (type === 'Feishu') {
        setFolderChildrenData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'pulling',
                }
              : item,
          ),
        );
      } else {
        setData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'pulling',
                }
              : item,
          ),
        );
      }
      if (
        ['Confluence', 'Wiki.js', 'Siyuan', 'MinDoc', 'Notion'].includes(type)
      ) {
        const TypeFunc = {
          Confluence: postApiV1CrawlerConfluenceScrape,
          'Wiki.js': postApiV1CrawlerWikijsScrape,
          Siyuan: postApiV1CrawlerSiyuanScrape,
          MinDoc: postApiV1CrawlerMindocScrape,
          Notion: postApiV1CrawlerNotionScrape,
        };
        const res = await TypeFunc[type as keyof typeof TypeFunc]({
          kb_id,
          doc_id: value.id,
          id: typeId,
        });
        setData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'pull-done',
                  content: res.content || '',
                }
              : item,
          ),
        );
      } else if (['RSS', 'Sitemap'].includes(type)) {
        const TypeFunc = {
          RSS: postApiV1CrawlerRssScrape,
          Sitemap: postApiV1CrawlerSitemapScrape,
        };
        const res = await TypeFunc[type as keyof typeof TypeFunc]({
          url: value.uuid,
          id: typeId,
          kb_id,
        });
        setData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'pull-done',
                  content: res.content || '',
                }
              : item,
          ),
        );
      } else if (type === 'Feishu') {
        const res = await postApiV1CrawlerFeishuGetDoc({
          kb_id,
          doc_id: value.id,
          id: value.id,
          space_id: value.space_id,
          file_type: value.file_type,
        });
        setFolderChildrenData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'pull-done',
                  content: res.content || '',
                }
              : item,
          ),
        );
      } else {
        const res = await getApiV1CrawlerResult({ task_id: value.id });
        if (res.status === 'completed') {
          setData(prev =>
            prev.map(item => {
              if (item.uuid !== value.uuid) return item;
              if (['creating', 'success', 'error'].includes(item.status))
                return item;
              return {
                ...item,
                status: 'pull-done',
                content: res.content || '',
              };
            }),
          );
        } else if (res.status === 'failed') {
          setData(prev =>
            prev.map(item => {
              if (item.uuid !== value.uuid) return item;
              if (['creating', 'success', 'error'].includes(item.status))
                return item;
              return {
                ...item,
                status: 'pull-error',
              };
            }),
          );
        } else {
          setTimeout(async () => {
            await handleParseData(value);
          }, 2000);
        }
      }
    } catch (error) {
      setData(prev =>
        prev.map(item => {
          if (item.uuid !== value.uuid) return item;
          if (['creating', 'success', 'error'].includes(item.status))
            return item;
          return {
            ...item,
            status: 'pull-error',
          };
        }),
      );
    }
    setLoading(false);
  };

  // 批量拉取数据
  const handleBatchPullData = async () => {
    setLoading(true);
    try {
      if (
        [
          'Confluence',
          'Wiki.js',
          'Siyuan',
          'MinDoc',
          'URL',
          'RSS',
          'Sitemap',
          'Notion',
        ].includes(type)
      ) {
        await Promise.all(
          data
            .filter(
              item =>
                checked.includes(item.uuid) &&
                ['upload-done', 'pull-error'].includes(item.status),
            )
            .map(item => handleParseData(item)),
        );
      } else if (['Feishu'].includes(type)) {
        await Promise.all(
          folderChildrenData
            .filter(
              item =>
                checked.includes(item.uuid) &&
                ['upload-done', 'pull-error'].includes(item.status),
            )
            .map(item => handleParseData(item)),
        );
      } else if (isUploadFileType) {
        setData(prev =>
          prev.map(item =>
            checked.includes(item.uuid)
              ? {
                  ...item,
                  status: ['upload-done', 'pull-error'].includes(item.status)
                    ? 'pulling'
                    : item.status,
                }
              : item,
          ),
        );

        const task_ids = data
          .filter(
            item =>
              checked.includes(item.uuid) &&
              ['upload-done', 'pull-error'].includes(item.status),
          )
          .map(item => item.id);

        const resq = await postApiV1CrawlerResults({ task_ids });
        const parseData = (resq.list || []).filter(
          it => !['pending', 'in_process'].includes(it.status!),
        );
        const parseIds = parseData.map(it => it.task_id);
        setData(prev => {
          return prev.map(it => {
            const idx = parseIds.findIndex(parseId => parseId === it.id);
            if (idx !== -1) {
              if (['creating', 'success', 'error'].includes(it.status)) {
                return it;
              }
              return {
                ...it,
                status:
                  parseData[idx].status === 'completed'
                    ? 'pull-done'
                    : 'pull-error',
                content: parseData[idx].content || '',
              };
            }
            return it;
          });
        });
        if (['pending', 'in_process'].includes(resq.status!)) {
          setTimeout(async () => {
            await handleBatchPullData();
          }, 2000);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // 创建文档
  const handleCreateDoc = async (value: DataItem) => {
    setLoading(true);
    if (type !== 'Feishu') {
      setData(prev =>
        prev.map(item =>
          item.uuid === value.uuid
            ? {
                ...item,
                status: 'creating',
              }
            : item,
        ),
      );
    } else {
      setFolderChildrenData(prev =>
        prev.map(item =>
          item.uuid === value.uuid
            ? {
                ...item,
                status: 'creating',
              }
            : item,
        ),
      );
    }
    try {
      await postApiV1Node({
        name: value?.title || '',
        content: value?.content || '',
        parent_id: parentId || undefined,
        type: 2,
        kb_id,
      });
      message.success('创建文档成功');
      if (type !== 'Feishu') {
        setData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'success',
                }
              : item,
          ),
        );
      } else {
        setFolderChildrenData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'success',
                }
              : item,
          ),
        );
      }
    } catch (error) {
      if (type !== 'Feishu') {
        setData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'error',
                }
              : item,
          ),
        );
      } else {
        setFolderChildrenData(prev =>
          prev.map(item =>
            item.uuid === value.uuid
              ? {
                  ...item,
                  status: 'error',
                }
              : item,
          ),
        );
      }
    }
    setLoading(false);
  };

  // 批量创建文档
  const handleBatchCreateDoc = async () => {
    setLoading(true);
    try {
      if (type !== 'Feishu') {
        await Promise.all(
          data
            .filter(
              item =>
                checked.includes(item.uuid) && item.status === 'pull-done',
            )
            .map(item => handleCreateDoc(item)),
        );
      } else {
        await Promise.all(
          folderChildrenData
            .filter(
              item =>
                checked.includes(item.uuid) && item.status === 'pull-done',
            )
            .map(item => handleCreateDoc(item)),
        );
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // 删除单个文件
  const handleRemoveFile = (index: number) => {
    setData(prev => prev.filter((_, i) => i !== index));
    setChecked(prev => prev.filter(it => it !== data[index].uuid));
  };

  // 批量删除文件
  const handleDeleteData = () => {
    setData(prev => prev.filter(item => !checked.includes(item.uuid)));
    setChecked([]);
  };

  // 单个文件选中
  const handleToggleSelect = (item: DataItem) => {
    if (item.type === 'folder') {
      const spaceID = item.space_id;
      const spaceChildren = folderChildrenData.filter(
        it => it.space_id === spaceID,
      );
      const currentSelected = folderChildrenData.filter(
        it => checked.includes(it.uuid) && it.space_id === spaceID,
      ).length;
      if (currentSelected !== spaceChildren.length) {
        setChecked(
          prev =>
            new Array(
              ...new Set([...prev, ...spaceChildren.map(it => it.uuid)]),
            ),
        );
      } else {
        setChecked(prev =>
          prev.filter(it => !spaceChildren.some(child => child.uuid === it)),
        );
      }
    } else {
      setChecked(prev => {
        if (prev.includes(item.uuid)) {
          return prev.filter(it => it !== item.uuid);
        }
        return [...prev, item.uuid];
      });
    }
  };

  // 全选操作
  const handleAllToggleSelect = () => {
    if (type === 'Feishu') {
      setChecked(prev => {
        if (folderChildrenData.length > prev.length) {
          return folderChildrenData.map(item => item.uuid);
        }
        return [];
      });
    } else {
      setChecked(prev => {
        if (data.length > prev.length) {
          return data.map(item => item.uuid);
        }
        return [];
      });
    }
  };

  // 折叠文件夹
  const handleFolderOpen = (item: DataItem) => {
    setData(prev =>
      prev.map(it =>
        it.uuid === item.uuid
          ? {
              ...it,
              open: !it.open,
            }
          : it,
      ),
    );
  };

  // 取消操作
  const handleCancel = () => {
    onCancel();
    refresh?.();
    setData([]);
    setTypeId('');
    setFormData({});
    setChecked([]);
    setFolderChildrenData([]);
    setLoading(false);
  };

  useEffect(() => {
    const total = {
      loading: 0,
      fail: 0,
      default: 0,
      waiting: 0,
      uploading: 0,
      pulling: 0,
      creating: 0,
      'upload-done': 0,
      'pull-done': 0,
      success: 0,
      'upload-error': 0,
      'pull-error': 0,
      error: 0,
    };
    data.forEach(it => {
      if (['uploading', 'pulling', 'creating'].includes(it.status)) {
        total.loading++;
      } else if (['upload-error', 'pull-error', 'error'].includes(it.status)) {
        total.fail++;
      }
      total[it.status as keyof typeof total]++;
    });

    if (type === 'Feishu') {
      folderChildrenData.forEach(it => {
        if (['uploading', 'pulling', 'creating'].includes(it.status)) {
          total.loading++;
        } else if (
          ['upload-error', 'pull-error', 'error'].includes(it.status)
        ) {
          total.fail++;
        }
        total[it.status as keyof typeof total]++;
      });
    }
    setTotalCount(total);
  }, [data, folderChildrenData, type]);

  const renderItem = (item: DataItem, index: number, depth: number = 0) => {
    return (
      <ListItem
        key={item.uuid}
        sx={{
          p: 0,
          pl: depth * 4,
          position: 'relative',
          borderBottom: '1px dashed',
          borderColor: 'divider',
          '.MuiListItemButton-root': {
            pr: 20,
          },
          '&:last-child': {
            borderBottom: 'none',
          },
          ':hover': {
            backgroundColor: 'background.paper3',
          },
        }}
        secondaryAction={
          item.status === 'success' ? null : (
            <Stack direction={'row'} gap={0} alignItems={'center'}>
              {item.type === 'folder' &&
                (!folderChildrenData.some(
                  it => it.space_id === item.space_id,
                ) ? (
                  <Button
                    size='small'
                    color='primary'
                    sx={{ px: 1, py: 0.5, minWidth: 0 }}
                    onClick={() => handleFolderPullData(item)}
                  >
                    拉取文档
                  </Button>
                ) : (
                  <IconButton
                    size='small'
                    sx={{
                      px: 1,
                      py: 0.5,
                      minWidth: 0,
                      transform: item.open ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => handleFolderOpen(item)}
                  >
                    <Icon type='icon-xiajiantou' />
                  </IconButton>
                ))}
              {item.type !== 'folder' && (
                <>
                  {isUploadFileType && item.status === 'uploading' && (
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <CircularProgress size={13} />
                      <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                        {item.progress}%
                      </Box>
                    </Stack>
                  )}
                  {item.status === 'pulling' && (
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <CircularProgress size={13} />
                      {item.progress &&
                      item.progress > 0 &&
                      item.progress < 100 ? (
                        <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                          {item.progress}%
                        </Box>
                      ) : (
                        <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                          数据拉取中
                        </Box>
                      )}
                    </Stack>
                  )}
                  {item.status === 'creating' && (
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <CircularProgress size={13} />
                      <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                        文档创建中
                      </Box>
                    </Stack>
                  )}
                  {item.type === 'file' && (
                    <>
                      {['default'].includes(item.status) && (
                        <Button
                          size='small'
                          color='primary'
                          sx={{ px: 1, py: 0.5, minWidth: 0 }}
                          onClick={() => handlerUploadFile(item)}
                          disabled={['uploading'].includes(item.status)}
                        >
                          导入
                        </Button>
                      )}
                      {item.status === 'upload-error' && (
                        <Button
                          size='small'
                          color='error'
                          sx={{ px: 1, py: 0.5, minWidth: 0 }}
                          onClick={() => handlerUploadFile(item)}
                          disabled={['uploading'].includes(item.status)}
                        >
                          重新导入
                        </Button>
                      )}
                    </>
                  )}
                  {['upload-done'].includes(item.status) && (
                    <Button
                      size='small'
                      color='primary'
                      sx={{ px: 1, py: 0.5, minWidth: 0 }}
                      onClick={() => handleParseData(item)}
                      disabled={['pulling'].includes(item.status)}
                    >
                      拉取数据
                    </Button>
                  )}
                  {item.status === 'pull-error' && (
                    <Button
                      size='small'
                      color='error'
                      sx={{ px: 1, py: 0.5, minWidth: 0 }}
                      onClick={() => handleParseData(item)}
                      disabled={['pulling', 'pull-done'].includes(item.status)}
                    >
                      重新拉取数据
                    </Button>
                  )}
                  {item.status === 'pull-done' && (
                    <Button
                      size='small'
                      color='primary'
                      sx={{ px: 1, py: 0.5, minWidth: 0 }}
                      onClick={() => handleCreateDoc(item)}
                      disabled={['uploading', 'pulling'].includes(item.status)}
                    >
                      创建文档
                    </Button>
                  )}
                  <Button
                    size='small'
                    color='error'
                    sx={{ px: 1, py: 0.5, minWidth: 0 }}
                    disabled={['uploading', 'pulling', 'creating'].includes(
                      item.status,
                    )}
                    onClick={() => handleRemoveFile(index)}
                  >
                    删除
                  </Button>
                </>
              )}
            </Stack>
          )
        }
      >
        {isUploadFileType &&
          ['uploading', 'pulling'].includes(item.status) &&
          (item.progress || 0) < 100 && (
            <Box
              sx={{
                width: `${item.progress}%`,
                transition: 'all 0.1s ease',
                height: '100%',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          )}
        <ListItemButton
          sx={{ p: 0 }}
          role={undefined}
          onClick={() => handleToggleSelect(item)}
          dense
        >
          {item.type !== 'folder' ? (
            <ListItemIcon sx={{ minWidth: 'auto', width: 40, height: 40 }}>
              {item.status === 'success' ? (
                <Stack
                  direction={'row'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  sx={{ flexShrink: 0, width: 40, height: 40 }}
                >
                  <Icon
                    type='icon-duihao'
                    sx={{ fontSize: 18, color: 'success.main' }}
                  />
                </Stack>
              ) : ['error', 'pull-error', 'upload-error'].includes(
                  item.status,
                ) ? (
                <Stack
                  direction={'row'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  sx={{ flexShrink: 0, width: 40, height: 40 }}
                >
                  <Icon
                    type='icon-icon_tool_close'
                    sx={{ fontSize: 18, color: 'error.main' }}
                  />
                </Stack>
              ) : (
                <Checkbox
                  edge='start'
                  size='small'
                  checked={checked.includes(item.uuid)}
                  tabIndex={-1}
                  disableRipple
                  sx={{ ml: '10px' }}
                  inputProps={{ 'aria-labelledby': item.uuid }}
                />
              )}
            </ListItemIcon>
          ) : (
            <Box sx={{ height: 40, width: 10 }}></Box>
          )}
          <ListItemText
            id={item.uuid}
            primary={
              item.type === 'folder' ? (
                <Stack direction={'row'} alignItems={'center'} gap={'10px'}>
                  {item.title !== '飞书云盘' ? (
                    <Icon
                      type={'icon-wenjianjia'}
                      sx={{ fontSize: 14, flexShrink: 0, width: 20 }}
                    />
                  ) : (
                    <Icon
                      type='icon-yunpan'
                      sx={{
                        fontSize: 20,
                        flexShrink: 0,
                        color: 'primary.main',
                      }}
                    />
                  )}
                  <Ellipsis sx={{ fontSize: 14 }}>{item.title}</Ellipsis>
                </Stack>
              ) : (
                <>
                  {item.title || item.file?.name || (
                    <Skeleton variant='text' width={200} height={21} />
                  )}
                </>
              )
            }
            secondary={
              item.content
                ? item.content
                : item.file
                  ? formatByte(item.file.size)
                  : ''
            }
            slotProps={{
              primary: {
                sx: {
                  fontSize: 14,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              },
              secondary: {
                sx: {
                  fontSize: 12,
                  color: 'text.disabled',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              },
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Modal
      open={open}
      width={800}
      disableEscapeKeyDown
      onCancel={handleCancel}
      title={TypeList[type].label}
      footer={null}
    >
      {isUploadFileType && (
        <Box sx={{ mb: data.length > 0 ? 2 : 0 }}>
          <Upload
            accept={TypeList[type].accept}
            multiple={['OfflineFile', 'Epub'].includes(type)}
            type={data.length > 0 ? 'select' : 'drag'}
            onChange={acceptFiles => handleInitFiles(acceptFiles)}
          />
        </Box>
      )}
      {data.length === 0 && (
        <>
          {type === 'URL' && (
            <>
              <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                sx={{
                  fontSize: 14,
                  lineHeight: '32px',
                }}
              >
                URL 地址
              </Stack>
              <TextField
                fullWidth
                multiline={true}
                rows={4}
                value={formData.url}
                placeholder={'每行一个 URL'}
                autoFocus
                onChange={e =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </>
          )}
          {type === 'RSS' && (
            <>
              <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                sx={{
                  fontSize: 14,
                  lineHeight: '32px',
                }}
              >
                RSS 地址
              </Stack>
              <TextField
                fullWidth
                value={formData.url}
                placeholder={'RSS 地址'}
                autoFocus
                onChange={e =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </>
          )}
          {type === 'Sitemap' && (
            <>
              <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                sx={{
                  fontSize: 14,
                  lineHeight: '32px',
                }}
              >
                Sitemap 地址
              </Stack>
              <TextField
                fullWidth
                value={formData.url}
                placeholder={'Sitemap 地址'}
                autoFocus
                onChange={e =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </>
          )}
          {type === 'Notion' && (
            <>
              <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                sx={{
                  fontSize: 14,
                  lineHeight: '32px',
                }}
              >
                Integration Secret
              </Stack>
              <TextField
                fullWidth
                value={formData.url}
                placeholder={'Integration Secret'}
                autoFocus
                onChange={e =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </>
          )}
          {type === 'Feishu' && (
            <>
              <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                sx={{
                  fontSize: 14,
                  lineHeight: '32px',
                }}
              >
                App ID
              </Stack>
              <TextField
                fullWidth
                value={formData.app_id}
                placeholder='> 飞书开放平台 > 凭证与基础信息 > 应用凭证 > App ID'
                autoFocus
                onChange={e =>
                  setFormData({ ...formData, app_id: e.target.value })
                }
              />
              <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                sx={{
                  fontSize: 14,
                  lineHeight: '32px',
                }}
              >
                Client Secret
              </Stack>
              <TextField
                fullWidth
                value={formData.app_secret}
                placeholder='> 飞书开放平台 > 凭证与基础信息 > 应用凭证 > App Secret'
                onChange={e =>
                  setFormData({ ...formData, app_secret: e.target.value })
                }
              />
              <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-between'}
                sx={{
                  fontSize: 14,
                  lineHeight: '32px',
                }}
              >
                User Access Token
              </Stack>
              <TextField
                fullWidth
                value={formData.user_access_token}
                onChange={e =>
                  setFormData({
                    ...formData,
                    user_access_token: e.target.value,
                  })
                }
              />
            </>
          )}
        </>
      )}
      {data.length > 0 && (
        <Box
          sx={{
            maxHeight: 'calc(100vh - 300px)',
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
          }}
        >
          <List
            dense
            sx={{
              p: 0,
            }}
          >
            {!(
              ['Confluence', 'Wiki.js', 'Yuque', 'Siyuan', 'MinDoc'].includes(
                type,
              ) && data.every(it => it.status === 'default')
            ) && (
              <ListItem
                sx={{
                  p: 0,
                  borderBottom: '1px dashed',
                  borderColor: 'divider',
                  ':hover': {
                    backgroundColor: 'background.paper3',
                  },
                }}
                secondaryAction={
                  checked.length > 0 && (
                    <Stack direction={'row'} gap={0} alignItems={'center'}>
                      {isUploadFileType &&
                        (totalCount['waiting'] > 0 ||
                          totalCount['upload-error'] > 0 ||
                          totalCount['default'] > 0) && (
                          <Button
                            size='small'
                            color='primary'
                            sx={{ px: 1, py: 0.5, minWidth: 0 }}
                            onClick={handleBatchUploadFile}
                          >
                            批量导入
                          </Button>
                        )}
                      {(type === 'Feishu' ? folderChildrenData : data)
                        .filter(item => checked.includes(item.uuid))
                        .some(item =>
                          ['upload-done', 'pull-error'].includes(item.status),
                        ) && (
                        <Button
                          size='small'
                          color='primary'
                          sx={{ px: 1, py: 0.5, minWidth: 0 }}
                          onClick={handleBatchPullData}
                        >
                          批量拉取数据
                        </Button>
                      )}
                      {(type === 'Feishu' ? folderChildrenData : data)
                        .filter(item => checked.includes(item.uuid))
                        .some(item => item.status === 'pull-done') && (
                        <Button
                          size='small'
                          color='primary'
                          sx={{ px: 1, py: 0.5, minWidth: 0 }}
                          onClick={handleBatchCreateDoc}
                        >
                          批量创建文档
                        </Button>
                      )}
                      {(type === 'Feishu' ? folderChildrenData : data)
                        .filter(item => checked.includes(item.uuid))
                        .some(item => item.status !== 'success') && (
                        <Button
                          size='small'
                          color='error'
                          disabled={(type === 'Feishu'
                            ? folderChildrenData
                            : data
                          )
                            .filter(item => checked.includes(item.uuid))
                            .some(item =>
                              ['uploading', 'pulling', 'creating'].includes(
                                item.status,
                              ),
                            )}
                          sx={{ px: 1, py: 0.5, minWidth: 0 }}
                          onClick={handleDeleteData}
                        >
                          批量删除
                        </Button>
                      )}
                    </Stack>
                  )
                }
              >
                <ListItemButton
                  sx={{
                    p: 0,
                  }}
                  role={undefined}
                  onClick={handleAllToggleSelect}
                  dense
                >
                  <ListItemIcon
                    sx={{ minWidth: 'auto', width: 40, height: 40 }}
                  >
                    <Checkbox
                      edge='start'
                      checked={
                        type === 'Feishu'
                          ? folderChildrenData.length === checked.length
                          : data.length === checked.length
                      }
                      tabIndex={-1}
                      disableRipple
                      sx={{ ml: '10px' }}
                      inputProps={{ 'aria-labelledby': 'checked-all' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack
                        direction={'row'}
                        alignItems={'flex-end'}
                        gap={2}
                        sx={{
                          color: 'warning.main',
                          fontSize: 12,
                          lineHeight: 1,
                        }}
                      >
                        <Box sx={{ fontSize: 14, color: 'text.primary' }}>
                          全选
                        </Box>
                        {totalCount.loading > 0 && (
                          <Stack
                            direction={'row'}
                            alignItems={'flex-end'}
                            gap={1}
                          >
                            <CircularProgress color='warning' size={12} />
                            <Box>
                              剩余 {totalCount.loading} 条数据正在处理中...
                            </Box>
                          </Stack>
                        )}
                        {totalCount.fail > 0 && (
                          <Stack
                            direction={'row'}
                            gap={1}
                            sx={{ color: 'error.main' }}
                          >
                            {totalCount['upload-error'] > 0 && (
                              <>{totalCount['upload-error']} 条上传失败</>
                            )}
                            {totalCount['pull-error'] > 0 && (
                              <>{totalCount['pull-error']} 条拉取失败</>
                            )}
                            {totalCount['error'] > 0 && (
                              <>{totalCount['error']} 条创建失败</>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    }
                    id={'checked-all'}
                  />
                </ListItemButton>
              </ListItem>
            )}
            {data.map((item, index) => {
              return (
                <>
                  {renderItem(item, index)}
                  {item.open &&
                    folderChildrenData
                      .filter(it => it.space_id === item.space_id)
                      .map((child, index) => {
                        return renderItem(child, index, 1);
                      })}
                </>
              );
            })}
          </List>
        </Box>
      )}
      {data.length === 0 && (
        <Stack
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          sx={{ mt: 2 }}
        >
          {TypeList[type].usage && (
            <Button
              component={'a'}
              href={TypeList[type].usage}
              target='_blank'
              sx={{
                fontSize: 14,
                fontWeight: 'normal',
                color: 'primary.main',
                display: 'inline-block',
              }}
            >
              使用方法
            </Button>
          )}
          {!isUploadFileType && (
            <Button
              variant='contained'
              loading={loading}
              onClick={handleSubmitForm}
            >
              {TypeList[type].okText || '拉取数据'}
            </Button>
          )}
        </Stack>
      )}
      {/* <Button variant="contained" loading={loading} onClick={() => {
      setData([]);
      setChecked([]);
      setTypeId('');
      setFolderChildrenData([]);
      setLoading(false);
    }}>
      清空数据
    </Button> */}
    </Modal>
  );
};

export default AddDocByOther;
