import { useEffect, useState } from "react"

interface Heading {
  id: string
  title: string
  heading: number
}

const useScroll = (headings: Heading[]) => {
  const [activeHeading, setActiveHeading] = useState<Heading | null>(null)

  useEffect(() => {
    const levels = Array.from(new Set(headings.map(it => it.heading).sort((a, b) => a - b))).slice(0, 3)
    const showHeader = headings.filter(header => levels.includes(header.heading))

    const handleScroll = () => {
      const offset = 80
      const scrollPosition = window.scrollY + offset

      const activeHeader = showHeader.find(header => {
        const element = document.getElementById(header.id)
        if (!element) return false
        const elementTop = element.getBoundingClientRect().top + window.scrollY
        return elementTop >= scrollPosition
      })

      if (activeHeader) {
        setActiveHeading(activeHeader)
        location.hash = activeHeader.title + '__' + activeHeader.id
      }
    }

    const hash = decodeURI(location.hash.slice(1)) || '';
    const id = hash.split('__')[1] || ''
    if (id) {
      const activeHeader = showHeader.find(header => header.id === id)
      if (activeHeader) {
        setActiveHeading(activeHeader)
        const element = document.getElementById(activeHeader.id)
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - offset;

          window.scrollTo({
            top: offsetPosition,
          });
        }
      } else {
        location.hash = ''
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  return {
    activeHeading,
  }
}

export default useScroll