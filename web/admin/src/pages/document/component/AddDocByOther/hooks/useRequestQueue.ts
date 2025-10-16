import { useCallback, useRef, useState } from 'react';

/**
 * 队列任务项
 */
export interface QueueTask<T = any> {
  id: string; // 任务唯一标识（通常是 item.uuid）
  execute: (signal: AbortSignal) => Promise<T>; // 执行函数，接收 AbortSignal
  onSuccess?: (result: T) => void; // 成功回调
  onError?: (error: Error) => void; // 失败回调
  onAbort?: () => void; // 中断回调
}

/**
 * 任务状态
 */
export interface TaskStatus {
  id: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'aborted';
  error?: Error;
  abortController?: AbortController;
}

/**
 * 请求队列 Hook
 *
 * @param maxConcurrent 最大并发数，默认 5
 * @returns 队列管理方法
 */
export const useRequestQueue = (maxConcurrent: number = 5) => {
  // 等待队列
  const waitingQueue = useRef<QueueTask[]>([]);

  // 运行中的任务
  const runningTasks = useRef<Map<string, TaskStatus>>(new Map());

  // 任务状态映射
  const [taskStatuses, setTaskStatuses] = useState<Map<string, TaskStatus>>(
    new Map(),
  );

  // 强制更新状态
  const updateTaskStatuses = useCallback(() => {
    setTaskStatuses(new Map(runningTasks.current));
  }, []);

  /**
   * 执行下一个任务
   */
  const runNext = useCallback(() => {
    // 如果已达到最大并发数，不执行
    if (runningTasks.current.size >= maxConcurrent) {
      return;
    }

    // 从等待队列取出任务
    const task = waitingQueue.current.shift();
    if (!task) {
      return;
    }

    // 创建 AbortController
    const abortController = new AbortController();

    // 添加到运行中的任务
    const taskStatus: TaskStatus = {
      id: task.id,
      status: 'running',
      abortController,
    };
    runningTasks.current.set(task.id, taskStatus);
    updateTaskStatuses();

    // 执行任务
    task
      .execute(abortController.signal)
      .then(result => {
        // 检查是否被中断
        if (abortController.signal.aborted) {
          return;
        }

        // 任务成功
        runningTasks.current.delete(task.id);
        task.onSuccess?.(result);
        updateTaskStatuses();

        // 执行下一个任务
        runNext();
      })
      .catch(error => {
        // 检查是否是中断错误
        if (error?.name === 'AbortError' || abortController.signal.aborted) {
          // 中断处理
          runningTasks.current.delete(task.id);
          task.onAbort?.();
          updateTaskStatuses();
        } else {
          // 其他错误
          runningTasks.current.delete(task.id);
          task.onError?.(error);
          updateTaskStatuses();
        }

        // 执行下一个任务
        runNext();
      });

    // 不在这里递归调用，因为任务完成/失败后会调用 runNext()
  }, [maxConcurrent, updateTaskStatuses]);

  /**
   * 添加任务到队列
   */
  const addTask = useCallback(
    (task: QueueTask) => {
      // 检查是否已存在
      if (
        runningTasks.current.has(task.id) ||
        waitingQueue.current.some(t => t.id === task.id)
      ) {
        console.warn(`Task ${task.id} already exists in queue`);
        return;
      }

      // 添加到等待队列
      waitingQueue.current.push(task);

      // 立即尝试执行
      runNext();
    },
    [runNext],
  );

  /**
   * 批量添加任务
   */
  const addTasks = useCallback(
    (tasks: QueueTask[]) => {
      tasks.forEach(task => {
        // 检查是否已存在
        if (
          !runningTasks.current.has(task.id) &&
          !waitingQueue.current.some(t => t.id === task.id)
        ) {
          waitingQueue.current.push(task);
        }
      });

      // 启动多个任务（最多到 maxConcurrent 数量）
      const availableSlots = maxConcurrent - runningTasks.current.size;
      const tasksToStart = Math.min(
        availableSlots,
        waitingQueue.current.length,
      );

      for (let i = 0; i < tasksToStart; i++) {
        runNext();
      }
    },
    [runNext, maxConcurrent],
  );

  /**
   * 中断单个任务
   */
  const abortTask = useCallback(
    (taskId: string) => {
      // 1. 检查是否在运行中
      const taskStatus = runningTasks.current.get(taskId);
      if (taskStatus?.abortController) {
        taskStatus.abortController.abort();
        taskStatus.status = 'aborted';

        // 更新状态
        runningTasks.current.set(taskId, taskStatus);
        updateTaskStatuses();
      }

      // 2. 从等待队列中移除（如果在等待队列中，也需要调用 onAbort）
      const waitingTaskIndex = waitingQueue.current.findIndex(
        task => task.id === taskId,
      );
      if (waitingTaskIndex !== -1) {
        const [removedTask] = waitingQueue.current.splice(waitingTaskIndex, 1);
        // 对于等待队列中的任务，直接调用 onAbort
        removedTask.onAbort?.();
      }
    },
    [updateTaskStatuses],
  );

  /**
   * 批量中断任务
   */
  const abortTasks = useCallback(
    (taskIds: string[]) => {
      taskIds.forEach(taskId => {
        abortTask(taskId);
      });
    },
    [abortTask],
  );

  /**
   * 中断所有任务
   */
  const abortAll = useCallback(() => {
    // 中断所有运行中的任务
    runningTasks.current.forEach(taskStatus => {
      if (taskStatus.abortController) {
        taskStatus.abortController.abort();
        taskStatus.status = 'aborted';
      }
    });

    // 对于等待队列中的任务，调用 onAbort
    waitingQueue.current.forEach(task => {
      task.onAbort?.();
    });

    // 清空等待队列
    waitingQueue.current = [];

    // 清空运行任务
    runningTasks.current.clear();
    updateTaskStatuses();
  }, [updateTaskStatuses]);

  /**
   * 获取任务状态
   */
  const getTaskStatus = useCallback(
    (taskId: string): TaskStatus | undefined => {
      return runningTasks.current.get(taskId);
    },
    [],
  );

  /**
   * 检查任务是否在运行
   */
  const isTaskRunning = useCallback((taskId: string): boolean => {
    return runningTasks.current.has(taskId);
  }, []);

  /**
   * 检查任务是否在等待
   */
  const isTaskWaiting = useCallback((taskId: string): boolean => {
    return waitingQueue.current.some(task => task.id === taskId);
  }, []);

  /**
   * 获取队列信息
   */
  const getQueueInfo = useCallback(() => {
    return {
      running: runningTasks.current.size,
      waiting: waitingQueue.current.length,
      total: runningTasks.current.size + waitingQueue.current.length,
    };
  }, []);

  /**
   * 清空队列（但不中断正在运行的任务）
   */
  const clearWaitingQueue = useCallback(() => {
    waitingQueue.current = [];
  }, []);

  return {
    // 添加任务
    addTask,
    addTasks,

    // 中断任务
    abortTask,
    abortTasks,
    abortAll,

    // 查询状态
    getTaskStatus,
    isTaskRunning,
    isTaskWaiting,
    getQueueInfo,
    taskStatuses,

    // 工具方法
    clearWaitingQueue,
  };
};

export default useRequestQueue;
