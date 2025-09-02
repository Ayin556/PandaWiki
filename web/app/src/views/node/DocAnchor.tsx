'use client';

import useScroll from '@/utils/useScroll';
import { Box } from '@mui/material';
import { TocItem, TocList } from '@yu-cq/tiptap';
import { useState } from 'react';

interface DocAnchorProps {
  headings: TocList;
}

const HeadingSx = [
  { fontWeight: 400, color: 'text.secondary' },
  { fontWeight: 400, color: 'text.tertiary' },
  { fontWeight: 400, color: 'text.disabled' },
];

const DocAnchor = ({ headings }: DocAnchorProps) => {
  const { activeHeading, scrollToElement } = useScroll(
    headings,
    document.querySelector('#scroll-container') as HTMLDivElement,
  );
  const [expand, setExpand] = useState(true);

  const levels = Array.from(
    new Set(headings?.map(it => it.level).sort((a, b) => a - b)),
  ).slice(0, 3);

  const handleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    heading: TocItem,
  ) => {
    e.preventDefault();
    if (scrollToElement) {
      scrollToElement(heading.id, 80);
    } else {
      const element = document.getElementById(heading.id);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        console.log(offsetPosition, 'offsetPosition==============');
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        setTimeout(() => {
          location.hash = encodeURIComponent(heading.textContent);
        }, 0);
      }
    }
  };

  return (
    <Box
      sx={{
        fontSize: 12,
        position: 'sticky',
        zIndex: 5,
        top: 96,
        right: 16,
        width: 200,
      }}
    >
      {headings.length > 0 && (
        <Box
          sx={{
            bgcolor: 'background.paper2',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'divider',
            padding: '16px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box
            sx={{
              fontWeight: 'bold',
              cursor: 'pointer',
              mb: 1,
              color: 'text.secondary',
            }}
          >
            内容大纲
          </Box>
          <Box
            sx={{
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              lineHeight: '32px',
              '&::-webkit-scrollbar': {
                display: 'none',
              },

              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {headings
              .filter(it => levels.includes(it.level))
              .map(heading => {
                const idx = levels.indexOf(heading.level);
                return (
                  <Box
                    key={heading.id}
                    sx={{
                      cursor: 'pointer',
                      pl: idx * 2,
                      ...HeadingSx[idx],
                      color:
                        activeHeading?.id === heading.id
                          ? 'primary.main'
                          : HeadingSx[idx].color,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      ':hover': {
                        color: 'primary.main',
                      },
                    }}
                    onClick={e => handleClick(e, heading)}
                  >
                    {heading.textContent}
                  </Box>
                );
              })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DocAnchor;
