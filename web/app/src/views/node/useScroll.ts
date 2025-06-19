import { useCallback, useEffect, useRef, useState } from "react"

interface Heading {
  id: string
  title: string
  heading: number
}

const useScroll = (headings: Heading[]) => {
  const [activeHeading, setActiveHeading] = useState<Heading | null>(null)
  const isFirstLoad = useRef(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManualScroll = useRef(false) // 标记是否为手动滚动，避免循环

  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
    return (...args: Parameters<T>) => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => func(...args), delay)
    }
  }

  // 滚动到指定元素（通过ID）
  const scrollToElement = useCallback((elementId: string, offset = 80) => {
    const element = document.getElementById(elementId)
    if (element) {
      const targetHeading = headings.find(h => h.id === elementId)
      if (targetHeading) {
        // 标记为手动滚动，避免在滚动过程中触发hash更新
        isManualScroll.current = true
        setActiveHeading(targetHeading)
        location.hash = encodeURIComponent(targetHeading.title)

        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })

        // 滚动完成后重置标记
        setTimeout(() => {
          isManualScroll.current = false
        }, 1000)
      }
    }
  }, [headings])

  // 找到当前可视窗口的第一个标题
  const findActiveHeading = useCallback(() => {
    const levels = Array.from(new Set(headings.map(it => it.heading).sort((a, b) => a - b))).slice(0, 3)
    const visibleHeadings = headings.filter(header => levels.includes(header.heading))

    if (visibleHeadings.length === 0) return null

    const offset = 100 // 偏移量，考虑header高度
    let activeHeader: Heading | null = null

    // 找到当前滚动位置之上最近的标题
    for (let i = visibleHeadings.length - 1; i >= 0; i--) {
      const header = visibleHeadings[i]
      const element = document.getElementById(header.id)
      if (element) {
        const elementTop = element.getBoundingClientRect().top + window.scrollY
        if (elementTop <= window.scrollY + offset) {
          activeHeader = header
          break
        }
      }
    }

    // 如果没有找到（说明在第一个标题之前），使用第一个标题
    if (!activeHeader && visibleHeadings.length > 0) {
      activeHeader = visibleHeadings[0]
    }

    return activeHeader
  }, [headings])

  // 滚动事件处理（带防抖）
  const debouncedScrollHandler = useCallback(
    debounce(() => {
      // 如果是手动滚动过程中，不更新活跃标题和hash
      if (isManualScroll.current) return

      const activeHeader = findActiveHeading()
      if (activeHeader && activeHeader.id !== activeHeading?.id) {
        setActiveHeading(activeHeader)
        // 更新URL hash
        location.hash = encodeURIComponent(activeHeader.title)
      }
    }, 100),
    [findActiveHeading, activeHeading]
  )

  // 处理首次加载时的hash滚动
  useEffect(() => {
    if (isFirstLoad.current && headings.length > 0) {
      const hash = decodeURIComponent(location.hash).slice(1)
      if (hash) {
        const targetHeading = headings.find(header => header.title === hash)
        if (targetHeading) {
          setActiveHeading(targetHeading)
          // 延迟滚动确保DOM已渲染
          setTimeout(() => {
            isManualScroll.current = true
            const element = document.getElementById(targetHeading.id)
            if (element) {
              const elementPosition = element.getBoundingClientRect().top
              const offsetPosition = elementPosition + window.scrollY - 80

              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              })
            }
            setTimeout(() => {
              isManualScroll.current = false
            }, 1000)
          }, 100)
        }
      } else {
        // 没有hash时，设置第一个标题为活跃状态并设置hash
        const activeHeader = findActiveHeading()
        if (activeHeader) {
          setActiveHeading(activeHeader)
          location.hash = encodeURIComponent(activeHeader.title)
        }
      }
      isFirstLoad.current = false
    }
  }, [headings, findActiveHeading])

  // 监听滚动事件
  useEffect(() => {
    if (headings.length > 0) {
      window.addEventListener('scroll', debouncedScrollHandler)
      // 初始检查
      debouncedScrollHandler()
    }

    return () => {
      window.removeEventListener('scroll', debouncedScrollHandler)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [headings, debouncedScrollHandler])

  return {
    activeHeading,
    scrollToElement, // 暴露滚动方法供点击大纲使用
  }
}

export default useScroll