/**
 * @leizm/benchmark
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import os from "os";
import { sleep } from "./sleep";

/**
 * 性能测试选项
 */
export interface Options {
  /** 标题 */
  title: string;
  /** 每个任务执行时长 */
  seconds: number;
  /** 并发数量（异步任务时有效） */
  concurrent: number;
  /** 每个任务间隔 */
  delay: number;
  /** 是否开启多进程，默认不开启 */
  clusterMode: boolean;
  /** 子进程数量，默认为CPU总数 */
  clusterCount: number;
}

export const DEFAULT_OPTIONS: Options = {
  title: "default",
  seconds: 2,
  concurrent: 100,
  delay: 1,
  clusterMode: false,
  clusterCount: os.cpus().length,
};

export type TaskSyncFunction = () => any;
export type TaskSyncFasterFunction = (count: number) => any;
export type TaskAsyncFunction = () => Promise<any>;
export type TaskCallbackFunction = (callback: () => void) => any;

export enum TaskFunctionType {
  Sync = 1,
  SyncFaster = 2,
  Async = 3,
  Callback = 4,
}

/**
 * 任务信息
 */
export interface TaskInfo {
  /** 标题 */
  title: string;
  /** 类型 */
  type: TaskFunctionType;
  /** 任务函数 */
  fn: TaskSyncFunction | TaskSyncFasterFunction | TaskAsyncFunction | TaskCallbackFunction;
  /** 任务参数 */
  params?: any;
}

export interface TaskResult {
  ok: boolean;
  message: string;
  task?: TaskInfo;
  result?: ExecTaskResult;
}

export interface ExecTaskResult {
  seconds: number;
  count: number;
}

export interface Result extends Options {
  list: TaskResult[];
}

export function execSyncFunction(seconds: number, fn: TaskSyncFunction, concurrent: number): Promise<ExecTaskResult> {
  return new Promise(resolve => {
    if (concurrent !== 1) concurrent = 1;
    const start = process.uptime();
    let count = 0;
    while (true) {
      fn();
      count++;
      const end = process.uptime();
      if (end - start >= seconds) {
        return resolve({ seconds: end - start, count });
      }
    }
  });
}

export function execSyncFasterFunction(
  seconds: number,
  fn: TaskSyncFasterFunction,
  concurrent: number,
  portionCount: number,
): Promise<ExecTaskResult> {
  return new Promise(resolve => {
    if (concurrent !== 1) concurrent = 1;
    const start = process.uptime();
    let count = 0;
    while (true) {
      fn(portionCount);
      count += portionCount;
      const end = process.uptime();
      if (end - start >= seconds) {
        return resolve({ seconds: end - start, count });
      }
    }
  });
}

export async function execAsyncFunction(
  seconds: number,
  fn: TaskAsyncFunction,
  concurrent: number,
): Promise<ExecTaskResult> {
  const start = process.uptime();
  let count = 0;
  const list: any[] = [];
  let isEnd = false;
  for (let i = 0; i < concurrent; i++) {
    list.push(
      (async function() {
        while (!isEnd) {
          await fn();
          count++;
        }
      })(),
    );
  }
  await sleep(seconds * 1000);
  isEnd = true;
  await Promise.all(list);
  const end = process.uptime();
  return { seconds: end - start, count };
}

export async function execCallbackFunction(
  seconds: number,
  fn: TaskCallbackFunction,
  concurrent: number,
): Promise<ExecTaskResult> {
  const start = process.uptime();
  let count = 0;
  const list: any[] = [];
  let isEnd = false;
  for (let i = 0; i < concurrent; i++) {
    list.push(
      (() =>
        new Promise(resolve => {
          const next = () => {
            if (isEnd) return resolve();
            count++;
            fn(next);
          };
          next();
        }))(),
    );
  }
  await sleep(seconds * 1000);
  isEnd = true;
  await Promise.all(list);
  const end = process.uptime();
  return { seconds: end - start, count };
}
