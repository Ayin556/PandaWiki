'use client';

import { NodeDetail } from '@/assets/type';
import useCopy from '@/hooks/useCopy';
import { useStore } from '@/provider';
import { ConstsCopySetting } from '@/request/types';
import { TocList, useTiptap } from '@ctzhian/tiptap';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Fab, Zoom } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import DocAnchor from './DocAnchor';
import DocContent from './DocContent';

const Doc = ({ node }: { node?: NodeDetail }) => {
  const { kbDetail, mobile } = useStore();
  const [headings, setHeadings] = useState<TocList>([]);
  const [characterCount, setCharacterCount] = useState(0);

  const editorRef = useTiptap({
    content: node?.content || '',
    editable: false,
    immediatelyRender: false,
    onTocUpdate: (toc: TocList) => {
      setHeadings(toc);
    },
    onCreate: ({ editor }) => {
      setCharacterCount((editor.storage as any).characterCount.characters());
    },
  });

  const docWidth = useMemo(() => {
    return kbDetail?.settings?.theme_and_style?.doc_width || 'full';
  }, [kbDetail]);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useCopy({
    mode:
      kbDetail?.settings?.copy_setting !== ConstsCopySetting.CopySettingDisabled
        ? 'allow'
        : 'disable',
    blockContextMenuWhenDisabled: false,
    suffix:
      kbDetail?.settings?.copy_setting === ConstsCopySetting.CopySettingAppend
        ? `\n\n-----------------------------------------\n内容来自 ${typeof window !== 'undefined' ? window.location.href : ''}`
        : '',
  });

  const handleScroll = () => {
    setShowScrollTop(window.scrollY > 300);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (node && editorRef && editorRef.editor) {
      requestAnimationFrame(() => {
        editorRef.editor.commands.setContent(node?.content || '');
      });
    }
  }, [node]);

  return (
    <>
      <DocContent
        info={node}
        docWidth={docWidth}
        editorRef={editorRef}
        characterCount={characterCount}
      />

      {!mobile && <DocAnchor headings={headings} />}

      <Zoom in={showScrollTop}>
        <Fab
          size='small'
          onClick={scrollToTop}
          sx={{
            backgroundColor: 'background.paper3',
            color: 'text.primary',
            position: 'fixed',
            bottom: 66,
            right: 16,
            zIndex: 1000,
          }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: 24 }} />
        </Fab>
      </Zoom>
    </>
  );
};

export default Doc;
