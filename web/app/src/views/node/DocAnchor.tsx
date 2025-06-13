'use client'

import { StyledAnchor } from "@/components/StyledHTML";
import { Box } from "@mui/material";
import { Ellipsis } from "ct-mui";
import { useEffect, useState } from "react";

interface Heading {
  id: string
  title: string
  heading: number
}

interface DocAnchorProps {
  title: string
  headings: Heading[]
  maxH: number
  activeHeading: Heading | null
}

const HeadingSx = [
  { fontSize: 14, fontWeight: 400, color: 'text.secondary' },
  { fontSize: 14, fontWeight: 400, color: 'text.tertiary' },
  { fontSize: 14, fontWeight: 400, color: 'text.disabled' },
]

const DocAnchor = ({ title, headings, maxH, activeHeading }: DocAnchorProps) => {
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
      location.hash = heading.title
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
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      {headings.filter(it => levels.includes(it.heading)).map((heading) => {
        const idx = levels.indexOf(heading.heading)
        return <Ellipsis key={heading.id} arrow sx={{
          cursor: 'pointer',
          pl: (idx + 1) * 2,
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
  </StyledAnchor>
}

export default DocAnchor;