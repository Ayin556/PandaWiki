'use client';

import { CONTENT_GAP, DOC_ANCHOR_WIDTH, DocWidth } from '@/constant';
import { useBasePath } from '@/hooks/useBasePath';
import { useStore } from '@/provider';
import { deepSearchFirstNode } from '@/utils';
import { convertToTree, filterEmptyFolders } from '@/utils/tree';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * 栏目导航条，展示在 Header 下方，仅有多个栏目时显示
 * 与下方文档内容区宽度保持一致（全屏/超宽/常宽）
 */
const NavBar = ({
  docWidth = 'full',
  catalogWidth = 260,
}: {
  docWidth?: string;
  catalogWidth?: number;
}) => {
  const {
    navList = [],
    selectedNavId,
    setSelectedNavId,
    navDataMap = {},
  } = useStore();
  const router = useRouter();
  const basePath = useBasePath();

  const handleNavChange = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      if (newValue === selectedNavId) return;
      setSelectedNavId?.(newValue);
      const nodeList = navDataMap[newValue];
      if (nodeList?.length) {
        const tree = filterEmptyFolders(convertToTree(nodeList));
        const firstNode = deepSearchFirstNode(tree);
        if (firstNode?.id) {
          router.push(`${basePath}/node/${firstNode.id}`);
        }
      }
    },
    [selectedNavId, setSelectedNavId, navDataMap, basePath, router],
  );

  if (!navList.length || navList.length <= 1) {
    return null;
  }

  const tabValue = selectedNavId || navList[0]?.id || '';

  const contentWidthStyle = useMemo(() => {
    if (docWidth === 'full') return { width: '100%' };
    const docContentWidth =
      DocWidth[docWidth as keyof typeof DocWidth]?.value ?? 0;
    const totalWidth =
      catalogWidth +
      CONTENT_GAP +
      docContentWidth +
      CONTENT_GAP +
      DOC_ANCHOR_WIDTH;
    return { width: totalWidth, minWidth: totalWidth, maxWidth: totalWidth };
  }, [docWidth, catalogWidth]);

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'center',
        px: { xs: 2, sm: 5 },
      }}
    >
      <Stack sx={contentWidthStyle}>
        <Tabs
          value={tabValue}
          onChange={handleNavChange}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              py: 1.5,
              fontSize: 14,
              textTransform: 'none',
            },
            '& .MuiTabs-indicator': { height: 2 },
          }}
        >
          {navList.map(nav => (
            <Tab key={nav.id} label={nav.name} value={nav.id} />
          ))}
        </Tabs>
      </Stack>
    </Box>
  );
};

export default NavBar;
