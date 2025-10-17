import { ImportDocProps, ImportDocType } from '@/api';
import Upload from '@/components/UploadFile/Drag';
import {
  postApiV1CrawlerFeishuListDoc,
  postApiV1CrawlerFeishuListSpaces,
  postApiV1CrawlerFeishuSearchWiki,
  postApiV1CrawlerNotionParse,
  postApiV1CrawlerRssParse,
  postApiV1CrawlerSitemapParse,
  postApiV1CrawlerYuqueParse,
} from '@/request';
import { useAppSelector } from '@/store';
import { message, Modal } from '@ctzhian/ui';
import { Box, Button, List, Stack } from '@mui/material';
import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BatchActionBar from './components/BatchActionBar';
import DocumentItem from './components/DocumentItem';
import FormInput from './components/FormInput';
import { TYPE_CONFIG, UPLOAD_FILE_TYPES } from './constants';
import { useDocumentData } from './hooks/useDocumentData';
import { useDocumentOperationsWithQueue } from './hooks/useDocumentOperationsWithQueue';
import { DataItem, FormData } from './types';
import { validateFormData } from './utils';

const AddDocByOther = ({
  type,
  open,
  refresh,
  onCancel,
  parentId = null,
}: ImportDocProps & { type: ImportDocType }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [typeId, setTypeId] = useState<string>('');
  const { kb_id } = useAppSelector(state => state.config);

  const isUploadFileType = UPLOAD_FILE_TYPES.includes(type);

  // 使用数据管理 Hook
  const {
    data,
    setData,
    folderChildrenData,
    setFolderChildrenData,
    checked,
    setChecked,
    currentData,
    totalCount,
    updateItemStatus,
    toggleSelect,
    toggleSelectAll,
    resetData,
  } = useDocumentData(type);

  // 使用队列操作 Hook
  const queueOperations = useDocumentOperationsWithQueue({
    type,
    kb_id,
    typeId,
    parentId,
    updateItemStatus,
    formData,
    onParseSuccess: useCallback(
      ({ typeId: newTypeId, docs }: { typeId: string; docs: DataItem[] }) => {
        setTypeId(newTypeId);
        setData(docs);
        setChecked(docs.map((it: DataItem) => it.uuid));
      },
      [setData, setChecked],
    ),
  });

  // ============ 本地文件初始化 ============
  const handleInitFiles = useCallback(
    (uploadFiles: File[]) => {
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
    },
    [type, setData, setChecked],
  );

  // ============ 表单提交 ============
  const handleSubmitForm = useCallback(async () => {
    const validation = validateFormData(formData, type);
    if (!validation.isValid) {
      message.error(validation.errorMessage);
      return;
    }

    setLoading(true);
    try {
      switch (type) {
        case 'URL': {
          const urls = formData.url?.split('\n').filter(u => u.trim()) || [];
          const urlItems: DataItem[] = urls.map(url => ({
            id: '',
            title: url,
            content: '',
            uuid: url,
            status: 'default',
            type: 'other',
          }));

          // 设置数据和选中项
          setData(urlItems);
          setChecked(urls);

          // 使用队列批量抓取 URL
          queueOperations.batchScrapeUrls(urlItems);
          break;
        }
        case 'RSS': {
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
        }
        case 'Sitemap': {
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
        }
        case 'Notion': {
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
        }
        case 'Feishu': {
          const reqData = {
            app_id: formData.app_id!,
            app_secret: formData.app_secret!,
            user_access_token: formData.user_access_token!,
          };
          const [spacesResp, docsResp] = await Promise.all([
            postApiV1CrawlerFeishuListSpaces(reqData),
            postApiV1CrawlerFeishuListDoc(reqData),
          ]);

          const feishuData: DataItem[] = [];
          if (spacesResp.length > 0) {
            feishuData.push(
              ...spacesResp.map(item => ({
                id: item.space_id!,
                space_id: item.space_id!,
                uuid: uuidv4(),
                type: 'folder' as const,
                title: item.name!,
                status: 'default' as const,
                open: true,
              })),
            );
          }
          if (docsResp.length > 0) {
            setFolderChildrenData(
              docsResp.map(item => ({
                id: item.id,
                uuid: item.doc_id,
                space_id: item.space_id,
                file_type: item.file_type,
                type: 'other' as const,
                title: item.title!,
                content: '',
                status: 'upload-done' as const,
              })),
            );
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
        }
        default:
          break;
      }
    } catch (error: Error | unknown) {
      message.error(
        error instanceof Error ? error.message : '操作失败，请稍后重试',
      );
    }
    setLoading(false);
  }, [formData, type, kb_id, setData, setChecked, setFolderChildrenData]);

  // ============ 文件夹操作 ============
  const handleFolderPullData = useCallback(
    async (item: DataItem) => {
      setLoading(true);
      try {
        setData(prev =>
          prev.map(it =>
            it.uuid === item.uuid ? { ...it, status: 'uploading' } : it,
          ),
        );
        const res = await postApiV1CrawlerFeishuSearchWiki({
          app_id: formData.app_id!,
          app_secret: formData.app_secret!,
          user_access_token: formData.user_access_token!,
          space_id: item.id,
        });
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
          prev.map(it =>
            it.uuid === item.uuid ? { ...it, status: 'default' } : it,
          ),
        );
        setFolderChildrenData(prev => [...prev, ...docs]);
      } catch (error) {
        setData(prev =>
          prev.map(it =>
            it.uuid === item.uuid ? { ...it, status: 'upload-error' } : it,
          ),
        );
      }
      setLoading(false);
    },
    [formData, setData, setFolderChildrenData],
  );

  const handleFolderOpen = useCallback(
    (item: DataItem) => {
      setData(prev =>
        prev.map(it =>
          it.uuid === item.uuid ? { ...it, open: !it.open } : it,
        ),
      );
    },
    [setData],
  );

  // ============ 文件上传（解析类型）============
  const handlerUploadFile = useCallback(
    async (item: DataItem) => {
      // Epub, OfflineFile 类型使用队列（可以中断）
      if (['Epub', 'OfflineFile'].includes(type)) {
        queueOperations.batchUploadFiles([item]);
        return;
      }

      // Confluence、Wiki.js、Siyuan、MinDoc 类型使用队列（可以中断）
      if (['Confluence', 'Wiki.js', 'Siyuan', 'MinDoc'].includes(type)) {
        queueOperations.batchUploadAndParseFiles([item]);
        return;
      }

      setLoading(true);
      try {
        if (type === 'Yuque') {
          setData(prev =>
            prev.map(it =>
              it.uuid === item.uuid ? { ...it, status: 'uploading' } : it,
            ),
          );
          const resp = await queueOperations.uploadFileToGetUrl(
            item.file!,
            (progress: number) => {
              setData(prev =>
                prev.map(it =>
                  it.uuid === item.uuid ? { ...it, progress } : it,
                ),
              );
            },
          );
          const yuqueResp = await postApiV1CrawlerYuqueParse({
            kb_id,
            key: resp.key,
            filename: resp.filename,
          });
          if (yuqueResp.list && yuqueResp.list.length > 0) {
            const newData: DataItem[] = yuqueResp.list.map(it => ({
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
        }
      } catch (error) {
        setData(prev =>
          prev.map(it =>
            it.uuid === item.uuid
              ? { ...it, status: 'upload-error', progress: 0 }
              : it,
          ),
        );
      }
      setLoading(false);
    },
    [type, kb_id, setData, setChecked, queueOperations],
  );

  // ============ 数据拉取（需要轮询的类型）============
  const handleParseData = useCallback(
    async (item: DataItem) => {
      // 所有类型都使用队列拉取（支持中断）
      queueOperations.batchPullData([item]);
    },
    [queueOperations],
  );

  // ============ 批量操作 ============
  const handleBatchUpload = useCallback(() => {
    const itemsToUpload = data.filter(
      item =>
        checked.includes(item.uuid) &&
        ['default', 'upload-error'].includes(item.status),
    );
    queueOperations.batchUploadFiles(itemsToUpload);
  }, [data, checked, queueOperations]);

  const handleBatchScrape = useCallback(() => {
    const itemsToScrape = data.filter(
      item =>
        checked.includes(item.uuid) &&
        ['default', 'upload-error'].includes(item.status),
    );
    queueOperations.batchScrapeUrls(itemsToScrape);
  }, [data, checked, queueOperations]);

  const handleBatchPull = useCallback(() => {
    const targetData = type === 'Feishu' ? folderChildrenData : data;
    const itemsToPull = targetData.filter(
      item =>
        checked.includes(item.uuid) &&
        ['upload-done', 'pull-error'].includes(item.status),
    );
    queueOperations.batchPullData(itemsToPull);
  }, [type, data, folderChildrenData, checked, queueOperations]);

  const handleBatchCreate = useCallback(() => {
    const targetData = type === 'Feishu' ? folderChildrenData : data;
    const itemsToCreate = targetData.filter(
      item =>
        checked.includes(item.uuid) &&
        (item.status === 'pull-done' || item.status === 'error'),
    );
    queueOperations.batchCreateDocuments(itemsToCreate);
  }, [type, data, folderChildrenData, checked, queueOperations]);

  const handleBatchAbort = useCallback(() => {
    const targetData = type === 'Feishu' ? folderChildrenData : data;
    const itemsToAbort = targetData
      .filter(
        item =>
          checked.includes(item.uuid) &&
          ['uploading', 'pulling', 'creating'].includes(item.status),
      )
      .map(item => item.uuid);
    if (itemsToAbort.length === 0) {
      message.warning('没有可中断的任务');
      return;
    }
    queueOperations.abortTasks(itemsToAbort);
  }, [type, data, folderChildrenData, checked, queueOperations]);

  const handleBatchDelete = useCallback(() => {
    const targetData = type === 'Feishu' ? folderChildrenData : data;
    const itemsToDelete = targetData.filter(
      item => checked.includes(item.uuid) && item.status !== 'success',
    );
    if (itemsToDelete.length === 0) {
      message.warning('没有可删除的数据');
      return;
    }
    if (type === 'Feishu') {
      setFolderChildrenData(prev =>
        prev.filter(item => !checked.includes(item.uuid)),
      );
    } else {
      setData(prev => prev.filter(item => !checked.includes(item.uuid)));
    }
    setChecked([]);
  }, [
    type,
    data,
    folderChildrenData,
    checked,
    setData,
    setFolderChildrenData,
    setChecked,
  ]);

  // 中断单个任务的包装函数
  const handleAbortItem = useCallback(
    (item: DataItem) => {
      queueOperations.abortTask(item.uuid);
    },
    [queueOperations],
  );

  // 单个 URL 重新抓取
  const handleScrapeUrl = useCallback(
    (item: DataItem) => {
      queueOperations.batchScrapeUrls([item]);
    },
    [queueOperations],
  );

  // ============ 单个文件操作 ============
  const handleRemoveFile = useCallback(
    (index: number) => {
      const item = data[index];
      setData(prev => prev.filter((_, i) => i !== index));
      setChecked(prev => prev.filter(it => it !== item?.uuid));
    },
    [data, setData, setChecked],
  );

  // ============ 取消/重置 ============
  const handleCancel = useCallback(() => {
    onCancel();
    refresh?.();
    resetData();
    setTypeId('');
    setFormData({});
    setLoading(false);
  }, [onCancel, refresh, resetData]);

  // ============ 渲染 ============
  return (
    <Modal
      open={open}
      width={900}
      disableEscapeKeyDown
      onCancel={handleCancel}
      title={TYPE_CONFIG[type].label}
      footer={null}
    >
      {/* 文件上传区域 */}
      {isUploadFileType && (
        <Box sx={{ mb: data.length > 0 ? 2 : 0 }}>
          <Upload
            accept={TYPE_CONFIG[type].accept}
            multiple={['OfflineFile', 'Epub'].includes(type)}
            type={data.length > 0 ? 'select' : 'drag'}
            onChange={handleInitFiles}
          />
        </Box>
      )}

      {/* 表单输入 */}
      {data.length === 0 && (
        <>
          <FormInput type={type} formData={formData} onChange={setFormData} />

          <Stack
            direction='row'
            alignItems='center'
            justifyContent='space-between'
            sx={{ mt: 2 }}
          >
            {TYPE_CONFIG[type].usage && (
              <Button
                component='a'
                href={TYPE_CONFIG[type].usage}
                target='_blank'
                sx={{
                  fontSize: 14,
                  fontWeight: 'normal',
                  color: 'primary.main',
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
                {TYPE_CONFIG[type].okText || '拉取数据'}
              </Button>
            )}
          </Stack>
        </>
      )}

      {/* 文档列表 */}
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
          <List dense sx={{ p: 0 }}>
            {/* 批量操作栏 */}
            {!(
              ['Confluence', 'Wiki.js', 'Yuque', 'Siyuan', 'MinDoc'].includes(
                type,
              ) && data.every(it => it.status === 'default')
            ) && (
              <BatchActionBar
                type={type}
                checked={checked}
                data={currentData}
                isUploadFileType={isUploadFileType}
                totalCount={totalCount}
                onToggleSelectAll={toggleSelectAll}
                onBatchUpload={handleBatchUpload}
                onBatchScrape={handleBatchScrape}
                onBatchPullData={handleBatchPull}
                onBatchCreateDoc={handleBatchCreate}
                onBatchDelete={handleBatchDelete}
                onBatchAbort={handleBatchAbort}
              />
            )}

            {/* 文档项列表 */}
            {data.map((item, index) => (
              <>
                <DocumentItem
                  key={item.uuid}
                  item={item}
                  index={index}
                  checked={checked.includes(item.uuid)}
                  isUploadFileType={isUploadFileType}
                  isRunning={queueOperations.isTaskRunning(item.uuid)}
                  onToggleSelect={toggleSelect}
                  onUpload={handlerUploadFile}
                  onScrapeUrl={handleScrapeUrl}
                  onPullData={handleParseData}
                  onCreateDoc={item =>
                    queueOperations.batchCreateDocuments([item])
                  }
                  onRemove={handleRemoveFile}
                  onFolderPullData={handleFolderPullData}
                  onFolderOpen={handleFolderOpen}
                  onAbort={handleAbortItem}
                  hasChildren={folderChildrenData.some(
                    it => it.space_id === item.space_id,
                  )}
                />
                {/* 文件夹子项 */}
                {item.open &&
                  folderChildrenData
                    .filter(it => it.space_id === item.space_id)
                    .map((child, childIndex) => (
                      <DocumentItem
                        key={child.uuid}
                        item={child}
                        index={childIndex}
                        depth={1}
                        checked={checked.includes(child.uuid)}
                        isUploadFileType={false}
                        isRunning={queueOperations.isTaskRunning(child.uuid)}
                        onToggleSelect={toggleSelect}
                        onPullData={handleParseData}
                        onCreateDoc={item =>
                          queueOperations.batchCreateDocuments([item])
                        }
                        onAbort={handleAbortItem}
                      />
                    ))}
              </>
            ))}
          </List>
        </Box>
      )}
    </Modal>
  );
};

export default AddDocByOther;
