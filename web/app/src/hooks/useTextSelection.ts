import { useState, useCallback, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';

interface TextSelectionHookProps {
  onFeedback?: (selectedText: string, screenshot?: string) => void;
}

interface TooltipPosition {
  x: number;
  y: number;
}

export const useTextSelection = ({
  onFeedback,
}: TextSelectionHookProps = {}) => {
  const [selectedText, setSelectedText] = useState('');
  const [tooltipAnchor, setTooltipAnchor] = useState<TooltipPosition | null>(
    null
  );
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 简单的初始化标记（覆盖层方法不需要CSS样式）
  const [highlightStyleInitialized, setHighlightStyleInitialized] =
    useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !highlightStyleInitialized) {
      // 覆盖层方法不需要额外的CSS样式，直接标记为已初始化
      setHighlightStyleInitialized(true);
      console.log('高亮功能已初始化（覆盖层方法）');
    }
  }, [highlightStyleInitialized]);

  // 为选中文字添加高亮样式（覆盖层方法，不改变DOM结构）
  const addHighlightToSelection = useCallback(
    (clearSelection = true) => {
      if (!highlightStyleInitialized) {
        console.warn('高亮样式未初始化');
        return null;
      }

      try {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return null;

        const highlightElements: HTMLElement[] = [];

        // 使用 getClientRects() 获取选中文本的所有矩形区域
        const rects = range.getClientRects();

        if (rects.length === 0) return null;

        // 为每个矩形区域创建一个覆盖层
        Array.from(rects).forEach((rect, index) => {
          const overlay = document.createElement('div');
          overlay.className = 'text-selection-highlight-overlay';
          overlay.setAttribute(
            'data-highlight-id',
            `highlight-${Date.now()}-${index}`
          );

          // 动态获取主题色
          const getPrimaryColorWithAlpha = (alpha: number) => {
            try {
              const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--mui-palette-primary-main')
                .trim();

              if (primaryColor.startsWith('#')) {
                const hex = primaryColor.slice(1);
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              }
            } catch (error) {
              console.warn('获取主题色失败:', error);
            }
            return `rgba(50, 72, 242, ${alpha})`; // 默认蓝色
          };

          // 调整高度以更好地匹配浏览器原生选择效果
          const adjustedHeight = rect.height * 1.2; // 最小18px高度
          const verticalOffset = (adjustedHeight - rect.height) / 2; // 垂直居中

          // 设置覆盖层的样式
          Object.assign(overlay.style, {
            position: 'absolute',
            left: `${rect.left + window.scrollX}px`,
            top: `${rect.top - verticalOffset + window.scrollY}px`,
            width: `${rect.width}px`,
            height: `${adjustedHeight}px`,
            backgroundColor: getPrimaryColorWithAlpha(0.2),
            borderRadius: '2px',
            pointerEvents: 'none',
            zIndex: '9999',
            // 添加一个标识，用于在截图后识别和移除
            border: '1px solid transparent',
          });

          // 将覆盖层添加到 body
          document.body.appendChild(overlay);
          highlightElements.push(overlay);
        });

        // 可选择是否清除选择状态
        if (clearSelection) {
          selection.removeAllRanges();
        }

        return {
          elements: highlightElements,
          isMultiple: highlightElements.length > 1,
          rangyApplied: false,
        };
      } catch (error) {
        console.warn('高亮失败:', error);
        return null;
      }
    },
    [highlightStyleInitialized]
  );

  // 移除高亮样式
  const removeHighlight = useCallback(
    (
      highlightData: {
        elements: HTMLElement[];
        isMultiple: boolean;
        rangyApplied?: boolean;
      } | null
    ) => {
      if (!highlightData) return;

      try {
        // 移除高亮覆盖层元素
        highlightData.elements.forEach((overlayElement) => {
          if (overlayElement && overlayElement.parentNode) {
            overlayElement.parentNode.removeChild(overlayElement);
          }
        });

        // 额外清理：查找并移除任何残留的高亮覆盖层
        const remainingOverlays = document.querySelectorAll(
          '.text-selection-highlight-overlay'
        );
        remainingOverlays.forEach((overlay) => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        });

        console.log(`移除了 ${highlightData.elements.length} 个高亮覆盖层`);
      } catch (error) {
        console.warn('移除高亮失败:', error);
      }
    },
    []
  );

  // 截取页面截图
  const captureScreenshot = useCallback(async (): Promise<
    string | undefined
  > => {
    let highlightData: {
      elements: HTMLElement[];
      isMultiple: boolean;
      rangyApplied?: boolean;
    } | null = null;

    try {
      // 尝试添加高亮但不清除选择状态
      if (highlightStyleInitialized) {
        highlightData = addHighlightToSelection(true);
        if (highlightData) {
          console.log('高亮元素数量:', highlightData.elements.length);
        }
      } else {
        console.log('高亮样式未初始化，进行无高亮截图');
      }

      // 延迟确保DOM完全更新
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 截取当前浏览器窗口（视口）
      let targetElement = document.body;

      const dataUrl = await toPng(targetElement, {
        quality: 0.9,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        backgroundColor: '#ffffff',
        filter: (node) => {
          // 过滤掉tooltip相关元素和高亮覆盖层
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // 过滤掉tooltip容器
            if (element.classList?.contains('text-selection-tooltip')) {
              return false;
            }

            // 过滤掉高亮覆盖层（这些应该已经包含在截图中了）
            if (
              element.classList?.contains('text-selection-highlight-overlay')
            ) {
              return true; // 保留覆盖层，让它们显示在截图中
            }

            // 过滤掉MUI Popover相关元素
            if (
              element.classList?.contains('MuiPopover-root') ||
              element.classList?.contains('MuiPopover-paper')
            ) {
              return false;
            }

            // 过滤掉所有portal容器中的tooltip
            if (
              element.closest('.text-selection-tooltip') ||
              element.closest('.MuiPopover-root')
            ) {
              return false;
            }
          }

          return true;
        },
        style: {
          transform: 'scale(1)',
        },
        width: window.innerWidth, // 浏览器窗口宽度
        height: window.innerHeight, // 浏览器窗口高度
      });

      return dataUrl;
    } catch (error) {
      console.warn('截图失败:', error);
      try {
        const dataUrl = await toPng(document.body, {
          quality: 0.8,
          pixelRatio: 1,
          backgroundColor: '#ffffff',
        });
        return dataUrl;
      } catch (fallbackError) {
        console.warn('备用截图也失败:', fallbackError);
        return undefined;
      }
    } finally {
      // 无论成功与否，都要移除高亮
      if (highlightData) {
        removeHighlight(highlightData);
      }
    }
  }, [addHighlightToSelection, removeHighlight]);

  // 处理文本选择
  const handleTextSelection = useCallback((event: MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTooltipOpen(false);
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();
    if (text.length === 0) {
      setTooltipOpen(false);
      setSelectedText('');
      return;
    }

    // 检查选择是否在容器区域内
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 排除反馈弹窗内的文本选择
    const checkElement =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as Element);

    const isInFeedbackModal = checkElement?.closest('.feedback-modal');

    if (isInFeedbackModal) {
      return;
    }

    if (
      containerRef.current &&
      containerRef.current.contains(range.commonAncestorContainer)
    ) {
      setSelectedText(text);
      setTooltipAnchor({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setTooltipOpen(true);
    }
  }, []);

  // 处理反馈建议
  const handleFeedbackSuggestion = useCallback(async () => {
    if (!selectedText || isCapturingScreenshot) return;

    console.log('开始截图反馈，选中文本:', selectedText);
    setIsCapturingScreenshot(true);

    try {
      // 检查当前是否还有选择
      const currentSelection = window.getSelection();
      console.log('当前选择状态:', {
        hasSelection: !!currentSelection,
        rangeCount: currentSelection?.rangeCount || 0,
        selectedText: currentSelection?.toString() || '',
      });

      // 小延迟确保UI状态更新完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 在保留选中状态和tooltip的情况下截图
      const screenshotData = await captureScreenshot();
      setScreenshot(screenshotData);

      // 截图完成后隐藏tooltip
      setTooltipOpen(false);

      // 调用外部传入的回调函数，传递选中文本和截图
      onFeedback?.(selectedText, screenshotData);
    } catch (error) {
      console.error('截图失败:', error);
      // 即使截图失败也打开弹窗，只是没有截图
      setTooltipOpen(false);
      onFeedback?.(selectedText, undefined);
    } finally {
      setIsCapturingScreenshot(false);
    }
  }, [selectedText, isCapturingScreenshot, captureScreenshot, onFeedback]);

  // 监听点击事件，点击其他地方时隐藏tooltip
  const handleDocumentClick = useCallback(
    (event: MouseEvent) => {
      if (
        tooltipOpen &&
        !(event.target as Element)?.closest('.text-selection-tooltip')
      ) {
        setTooltipOpen(false);
        setSelectedText('');
        setScreenshot(undefined);
        setIsCapturingScreenshot(false);
      }
    },
    [tooltipOpen]
  );

  // 设置事件监听器
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      // 延迟执行，确保选择完成
      setTimeout(() => handleTextSelection(event), 10);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [handleTextSelection, handleDocumentClick]);

  // 清理选择状态的方法
  const clearSelection = useCallback(() => {
    setTooltipOpen(false);
    setSelectedText('');
    setScreenshot(undefined);
    setIsCapturingScreenshot(false);

    // 清理可能存在的高亮覆盖层元素
    const highlightOverlays = document.querySelectorAll(
      '.text-selection-highlight-overlay'
    );
    highlightOverlays.forEach((overlay) => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });

    // 清理选择状态
    window.getSelection()?.removeAllRanges();
  }, []);

  return {
    selectedText,
    tooltipAnchor,
    tooltipOpen,
    screenshot,
    isCapturingScreenshot,
    containerRef,
    handleFeedbackSuggestion,
    clearSelection,
  };
};
