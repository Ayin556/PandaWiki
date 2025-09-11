'use client';
import { IconMulu } from '@/components/icons';
import { useStore } from '@/provider';
import { filterTreeBySearch } from '@/utils';
import { addExpandState } from '@/utils/drag';
import { Box, Stack, Tooltip } from '@mui/material';
import { useDebounce } from 'ahooks';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import CatalogFolder from './CatalogFolder';

const Catalog = () => {
  const params = useParams() || {};
  const id = params.id as string;
  const {
    kbDetail,
    mobile = false,
    catalogShow,
    setCatalogShow,
    catalogWidth,
    setCatalogWidth,
    tree: initialTree,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 300 });

  const catalogSetting = kbDetail?.settings?.catalog_settings;
  const catalogFolderExpand = catalogSetting?.catalog_folder !== 2;
  const docWidth = kbDetail?.settings?.theme_and_style?.doc_width || 'full';

  const tree = useMemo(() => {
    const { tree: originalTree } = addExpandState(
      initialTree || [],
      id as string,
      catalogFolderExpand,
    );
    return filterTreeBySearch(originalTree, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  if (mobile) return null;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 114,
        flexShrink: 0,
        maxHeight: 'calc(100vh - 164px)',
        zIndex: 9,
        fontSize: 14,
        width: catalogWidth,
        transition: 'width 0.3s ease-in-out',
        ...(!catalogShow &&
          docWidth === 'full' && {
            width: 0,
          }),
      }}
    >
      <Box
        sx={{
          width: '100%',
          transition: 'width 0.3s ease-in-out',
          float: docWidth === 'full' ? 'left' : 'right',
          ...(!catalogShow && {
            width: 0,
          }),
        }}
      >
        <Stack
          direction={'row'}
          alignItems={'center'}
          gap={1}
          sx={{
            mb: 1,
            px: 1,
            height: '22px',
          }}
        >
          <Tooltip title={catalogShow ? null : '展开目录'} arrow>
            <IconMulu
              sx={{ fontSize: 16, cursor: 'pointer' }}
              onClick={() => setCatalogShow?.(!catalogShow)}
            />
          </Tooltip>
          <Box
            sx={{
              fontWeight: 'bold',
              width: '30px',
              opacity: 1,
              wordBreak: 'keep-all',
              transition: 'opacity 0.2s ease-in-out',
              ...(!catalogShow && {
                opacity: 0,
              }),
            }}
          >
            目录
          </Box>
        </Stack>
        <Box
          sx={{
            maxHeight: 'calc(100vh - 194px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out',
            ...(!catalogShow && {
              opacity: 0,
            }),
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {tree.map(item => (
            <CatalogFolder
              key={item.id}
              item={item}
              searchTerm={debouncedSearchTerm}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Catalog;
