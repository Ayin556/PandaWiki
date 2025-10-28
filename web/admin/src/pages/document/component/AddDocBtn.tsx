import Cascader from '@/components/Cascader';
import { ConstsCrawlerSource } from '@/request';
import { addOpacityToColor } from '@/utils';
import { Box, Button, Stack, useTheme } from '@mui/material';
import { useState } from 'react';
import AddDocByType from './AddDocByType';
import DocAddByCustomText from './DocAddByCustomText';

interface InputContentProps {
  exportFile?: boolean;
  refresh?: () => void;
  context?: React.ReactElement<{ onClick?: any; 'aria-describedby'?: any }>;
  createLocal?: (node: {
    id: string;
    name: string;
    type: 1 | 2;
    emoji?: string;
    parentId?: string | null;
  }) => void;
  scrollTo?: (id: string) => void;
}

const AddDocBtn = ({
  exportFile = true,
  refresh,
  context,
  createLocal,
  scrollTo,
}: InputContentProps) => {
  const theme = useTheme();
  const [customDocOpen, setCustomDocOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [key, setKey] = useState<ConstsCrawlerSource | null>(null);
  const [docFileKey, setDocFileKey] = useState<1 | 2>(1);

  const ImportContentWays = {
    docFile: {
      label: '创建文件夹',
      onClick: () => {
        setDocFileKey(1);
        setCustomDocOpen(true);
      },
    },
    customDoc: {
      label: '创建文档',
      onClick: () => {
        setDocFileKey(2);
        setCustomDocOpen(true);
      },
    },
    ...(exportFile
      ? {
          [ConstsCrawlerSource.CrawlerSourceFile]: {
            label: '通过离线文件导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceFile);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceUrl]: {
            label: '通过 URL 导入',
            onClick: () => {
              setKey(ConstsCrawlerSource.CrawlerSourceUrl);
              setUploadOpen(true);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceRSS]: {
            label: '通过 RSS 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceRSS);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceSitemap]: {
            label: '通过 Sitemap 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceSitemap);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceNotion]: {
            label: '通过 Notion 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceNotion);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceEpub]: {
            label: '通过 Epub 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceEpub);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceWikijs]: {
            label: '通过 Wiki.js 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceWikijs);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceYuque]: {
            label: '通过 语雀 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceYuque);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceSiyuan]: {
            label: '通过 思源笔记 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceSiyuan);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceMindoc]: {
            label: '通过 MinDoc 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceMindoc);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceFeishu]: {
            label: '通过飞书文档导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceFeishu);
            },
          },
          [ConstsCrawlerSource.CrawlerSourceConfluence]: {
            label: '通过 Confluence 导入',
            onClick: () => {
              setUploadOpen(true);
              setKey(ConstsCrawlerSource.CrawlerSourceConfluence);
            },
          },
        }
      : {}),
  };

  const close = () => {
    setUploadOpen(false);
    setCustomDocOpen(false);
  };

  return (
    <Box>
      <Cascader
        list={Object.entries(ImportContentWays).map(([key, value]) => ({
          key,
          label: (
            <Box key={key}>
              <Stack
                direction={'row'}
                alignItems={'center'}
                gap={1}
                sx={{
                  fontSize: 14,
                  px: 2,
                  lineHeight: '40px',
                  height: 40,
                  width: 180,
                  borderRadius: '5px',
                  cursor: 'pointer',
                  ':hover': {
                    bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
                  },
                }}
                onClick={value.onClick}
              >
                {value.label}
              </Stack>
              {key === ConstsCrawlerSource.CrawlerSourceFile && (
                <Box
                  sx={{
                    borderTop: '1px solid',
                    borderColor: theme.palette.divider,
                    my: 0.5,
                  }}
                />
              )}
            </Box>
          ),
        }))}
        context={context || <Button variant='contained'>创建文档</Button>}
      />
      {key && (
        <AddDocByType
          type={key}
          open={uploadOpen}
          refresh={refresh}
          onCancel={close}
          parentId={null}
          // 导入类操作：刷新后由上层保持展开状态，并由上层决定滚动位置
        />
      )}
      <DocAddByCustomText
        type={docFileKey}
        open={customDocOpen}
        // 本地创建：不刷新，创建后本地追加并滚动
        refresh={refresh}
        onCreated={node => {
          createLocal?.(node);
          scrollTo?.(node.id);
        }}
        onClose={() => setCustomDocOpen(false)}
      />
    </Box>
  );
};

export default AddDocBtn;
