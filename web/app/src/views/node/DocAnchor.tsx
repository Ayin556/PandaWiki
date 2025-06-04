'use client'

import { StyledAnchor } from "@/components/StyledHTML";
import { Box } from "@mui/material";
import { Ellipsis } from "ct-mui";
import { useEffect, useState } from "react";

interface DocAnchorProps {
  title: string
  headings: { id: string, title: string, heading: number }[]
  maxH: number
}

const HeadingSx = [
  { fontSize: 14, fontWeight: 400, color: 'text.secondary' },
  { fontSize: 14, fontWeight: 400, color: 'text.tertiary' },
  { fontSize: 14, fontWeight: 400, color: 'text.disabled' },
]

const DocAnchor = ({ title, headings, maxH }: DocAnchorProps) => {
  const levels = Array.from(new Set(headings.map(it => it.heading).sort((a, b) => a - b))).slice(0, 3)
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const showHeader = headings.filter(header => levels.includes(header.heading))
    const handleScroll = () => {
      const offset = 100
      const scrollPosition = window.scrollY + offset

      const activeHeader = showHeader.find(header => {
        const element = document.getElementById(header.id)
        if (!element) return false
        const elementTop = element.getBoundingClientRect().top + window.scrollY
        return elementTop >= scrollPosition
      })

      if (activeHeader) {
        setActiveId(activeHeader.id)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return <StyledAnchor>
    {title && <Ellipsis arrow sx={{
      fontWeight: 'bold',
      cursor: 'pointer',
      mb: 1,
      color: 'text.secondary',
    }}>
      {title}
    </Ellipsis>}
    <Box sx={{
      height: 'calc(100vh - 174px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      lineHeight: '32px',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      '-ms-overflow-style': 'none',
      'scrollbar-width': 'none',
    }}>
      {headings.filter(it => levels.includes(it.heading)).map((heading) => {
        const idx = levels.indexOf(heading.heading)
        return <Ellipsis key={heading.id} arrow sx={{
          cursor: 'pointer',
          ml: (idx + 1) * 2,
          ...HeadingSx[idx],
          color: activeId === heading.id ? 'primary.main' : HeadingSx[idx].color,
          ':hover': {
            color: 'primary.main'
          }
        }} onClick={(e) => handleClick(e, heading.id)}>
          {heading.title}
        </Ellipsis>
      })}
    </Box>
  </StyledAnchor>
}

export default DocAnchor;