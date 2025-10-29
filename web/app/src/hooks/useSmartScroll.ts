import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseSmartScrollOptions {
  /**
   * 容器的选择器（支持 CSS 选择器字符串或直接传入 HTMLElement）
   * @default '.conversation-container'
   */
  container?: string | HTMLElement | (() => HTMLElement | null);

  /**
   * 距离底部的阈值（像素），在此范围内认为用户在底部
   * @default 10
   */
  threshold?: number;

  /**
   * 滚动行为
   * @default 'smooth'
   */
  behavior?: ScrollBehavior;

  /**
   * 是否启用智能滚动
   * @default true
   */
  enabled?: boolean;
}

export interface UseSmartScrollReturn {
  /**
   * 当前是否应该自动滚动
   */
  shouldAutoScroll: boolean;

  /**
   * 滚动到底部（会根据 shouldAutoScroll 判断是否执行）
   */
  scrollToBottom: () => void;

  /**
   * 强制滚动到底部（忽略 shouldAutoScroll 状态）
   */
  forceScrollToBottom: () => void;

  /**
   * 手动设置是否应该自动滚动
   */
  setShouldAutoScroll: (value: boolean) => void;

  /**
   * 检查当前是否在底部
   */
  checkIfAtBottom: () => boolean;

  /**
   * 获取容器元素
   */
  getContainer: () => HTMLElement | null;
}

/**
 * 智能滚动 Hook
 *
 * 自动检测用户滚动行为，当用户主动向上滚动时停止自动滚动，
 * 当用户滚动到底部时恢复自动滚动。
 *
 * @example
 * ```tsx
 * const { scrollToBottom, setShouldAutoScroll } = useSmartScroll({
 *   container: '.my-container',
 *   threshold: 20,
 * });
 *
 * // 在新消息到达时
 * useEffect(() => {
 *   scrollToBottom();
 * }, [messages]);
 *
 * // 开始新对话时重置自动滚动
 * const startNewChat = () => {
 *   setShouldAutoScroll(true);
 *   // ...
 * };
 * ```
 */
export function useSmartScroll(
  options: UseSmartScrollOptions = {},
): UseSmartScrollReturn {
  const {
    container = '.conversation-container',
    threshold = 10,
    behavior = 'smooth',
    enabled = true,
  } = options;

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  /**
   * 使用 ref 存储同步的自动滚动标志，避免异步状态更新导致的竞争条件
   *
   * 场景说明：
   * 1. SSE 流式输出内容，触发 scrollToBottom()
   * 2. 用户向上滚动，触发 scroll 事件
   * 3. scroll 事件调用 setShouldAutoScroll(false) - 这是异步的
   * 4. 但在状态更新前，又有新的 SSE 内容到达，再次触发 scrollToBottom()
   * 5. 此时 shouldAutoScroll 状态可能还是 true，导致意外滚动
   *
   * 解决方案：
   * - ref 的更新是同步的，scroll 事件会立即更新 ref
   * - scrollToBottom() 检查 ref 而不是 state，确保获取最新值
   * - state 仍然保留，用于可能需要响应式更新的场景
   */
  const shouldAutoScrollRef = useRef(true);
  const containerRef = useRef<HTMLElement | null>(null);

  /**
   * 获取容器元素
   */
  const getContainer = useCallback((): HTMLElement | null => {
    if (!enabled) return null;

    // 如果已经缓存了容器，直接返回（前提是容器仍在 DOM 中）
    if (containerRef.current && document.contains(containerRef.current)) {
      return containerRef.current;
    }

    // 根据不同的 container 类型获取元素
    let element: HTMLElement | null = null;

    if (typeof container === 'string') {
      element = document.querySelector<HTMLElement>(container);
    } else if (typeof container === 'function') {
      element = container();
    } else if (container instanceof HTMLElement) {
      element = container;
    }

    // 缓存容器引用
    if (element) {
      containerRef.current = element;
    }

    return element;
  }, [container, enabled]);

  /**
   * 检查用户是否在底部（只读检查，不修改状态）
   */
  const checkIfAtBottom = useCallback((): boolean => {
    const element = getContainer();
    if (!element) return false;

    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight <=
      threshold;

    return isAtBottom;
  }, [getContainer, threshold]);

  /**
   * 处理滚动事件
   */
  const handleScrollEvent = useCallback(
    (event: Event) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      if (target) {
        const isAtBottom =
          target.scrollHeight - target.scrollTop - target.clientHeight <=
          threshold;
        // 同步更新 ref，避免竞争条件
        shouldAutoScrollRef.current = isAtBottom;
        // 异步更新 state，用于响应式更新
        setShouldAutoScroll(isAtBottom);
      }
    },
    [threshold, enabled],
  );

  /**
   * 强制滚动到底部（忽略 shouldAutoScroll 状态）
   */
  const forceScrollToBottom = useCallback(() => {
    if (!enabled) return;

    const element = getContainer();
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior,
      });
    }
  }, [getContainer, behavior, enabled]);

  /**
   * 滚动到底部（会根据 shouldAutoScroll 判断）
   * 注意：这里使用 ref 而不是 state，确保检查的是最新的同步值
   */
  const scrollToBottom = useCallback(() => {
    if (!shouldAutoScrollRef.current || !enabled) return;
    forceScrollToBottom();
  }, [forceScrollToBottom, enabled]);

  /**
   * 监听滚动事件
   */
  useEffect(() => {
    if (!enabled) return;

    const element = getContainer();
    if (!element) return;

    element.addEventListener('scroll', handleScrollEvent);

    return () => {
      element.removeEventListener('scroll', handleScrollEvent);
    };
  }, [getContainer, handleScrollEvent, enabled]);

  /**
   * 手动设置是否应该自动滚动（包装函数，同时更新 state 和 ref）
   */
  const setShouldAutoScrollWrapper = useCallback((value: boolean) => {
    shouldAutoScrollRef.current = value;
    setShouldAutoScroll(value);
  }, []);

  return {
    shouldAutoScroll,
    scrollToBottom,
    forceScrollToBottom,
    setShouldAutoScroll: setShouldAutoScrollWrapper,
    checkIfAtBottom,
    getContainer,
  };
}
