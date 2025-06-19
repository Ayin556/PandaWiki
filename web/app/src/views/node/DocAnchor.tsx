'use client'

import { Box } from "@mui/material";

interface Heading {
  id: string
  title: string
  heading: number
}

interface DocAnchorProps {
  title: string
  headings: Heading[]
  activeHeading: Heading | null
  onScrollToElement?: (elementId: string, offset?: number) => void
}

const HeadingSx = [
  { fontWeight: 400, color: 'text.secondary' },
  { fontWeight: 400, color: 'text.tertiary' },
  { fontWeight: 400, color: 'text.disabled' },
]

const DocAnchor = ({ title, headings, activeHeading, onScrollToElement }: DocAnchorProps) => {
  const levels = Array.from(new Set(headings.map(it => it.heading).sort((a, b) => a - b))).slice(0, 3)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, heading: { id: string, title: string, heading: number }) => {
    e.preventDefault();
    if (onScrollToElement) {
      onScrollToElement(heading.id, 80);
    } else {
      // 降级处理，如果没有传递滚动方法
      const element = document.getElementById(heading.id);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        // 降级模式下也要更新hash
        location.hash = encodeURIComponent(heading.title);
      }
    }
  };

  return <Box sx={{
    gap: '8px',
    fontSize: 12,
    position: 'fixed',
    zIndex: 5,
    top: 96,
    right: 16,
    width: 200,
    bgcolor: 'background.paper',
    borderRadius: '10px',
    border: '1px solid',
    borderColor: 'divider',
    padding: '16px',
  }}>
    {title && <Box sx={{
      fontWeight: 'bold',
      cursor: 'pointer',
      mb: 1,
      color: 'text.secondary',
    }}>
      内容大纲
    </Box>}
    <Box sx={{
      maxHeight: 'calc(100vh - 174px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      lineHeight: '32px',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      {headings.filter(it => levels.includes(it.heading)).map((heading) => {
        const idx = levels.indexOf(heading.heading)
        return <Box key={heading.id} sx={{
          cursor: 'pointer',
          pl: idx * 2,
          ...HeadingSx[idx],
          color: activeHeading?.id === heading.id ? 'primary.main' : HeadingSx[idx].color,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ':hover': {
            color: 'primary.main'
          }
        }} onClick={(e) => handleClick(e, heading)}>
          {heading.title}
        </Box>
      })}
    </Box>
  </Box>
}

export default DocAnchor;