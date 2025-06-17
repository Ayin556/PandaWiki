'use client'

import { Box } from "@mui/material";
import { Ellipsis } from "ct-mui";

interface Heading {
  id: string
  title: string
  heading: number
}

interface DocAnchorProps {
  title: string
  headings: Heading[]
  activeHeading: Heading | null
}

const HeadingSx = [
  { fontWeight: 400, color: 'text.secondary' },
  { fontWeight: 400, color: 'text.tertiary' },
  { fontWeight: 400, color: 'text.disabled' },
]

const DocAnchor = ({ title, headings, activeHeading }: DocAnchorProps) => {
  const levels = Array.from(new Set(headings.map(it => it.heading).sort((a, b) => a - b))).slice(0, 3)


  const handleClick = (e: React.MouseEvent<HTMLDivElement>, heading: { id: string, title: string, heading: number }) => {
    e.preventDefault();
    const element = document.getElementById(heading.id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      location.hash = heading.title + '__' + heading.id.split('heading-')[1]
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
      大纲
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
        return <Ellipsis key={heading.id} arrow sx={{
          cursor: 'pointer',
          pl: idx * 2,
          ...HeadingSx[idx],
          color: activeHeading?.id === heading.id ? 'primary.main' : HeadingSx[idx].color,
          ':hover': {
            color: 'primary.main'
          }
        }} onClick={(e) => handleClick(e, heading)}>
          {heading.title}
        </Ellipsis>
      })}
    </Box>
  </Box>
}

export default DocAnchor;