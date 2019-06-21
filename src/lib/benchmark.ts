/**
 * @leizm/benchmark
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import colors from "colors";
import Table from "cli-table";
import { platformInfo } from "./platforminfo";
import { sleep } from "./sleep";
import {
  Options,
  Result,
  TaskInfo,
  TaskResult,
  DEFAULT_OPTIONS,
  ExecTaskResult,
  TaskAsyncFunction,
  TaskSyncFunction,
  TaskSyncFasterFunction,
  TaskFunctionType,
  TaskCallbackFunction,
  execAsyncFunction,
  execCallbackFunction,
  execSyncFasterFunction,
  execSyncFunction,
} from "./base";

export class Benchmark {
  protected options: Options;
  protected list: TaskInfo[] = [];
  protected result?: Result;

  constructor(options: Partial<Options> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  public addSync(title: string, fn: TaskSyncFunction): this {
    this.list.push({ title, type: TaskFunctionType.Sync, fn });
    return this;
  }

  public addSyncFaster(title: string, fn: TaskSyncFasterFunction, count: number = 10000): this {
    this.list.push({ title, type: TaskFunctionType.SyncFaster, fn, params: count });
    return this;
  }

  public addAsync(title: string, fn: TaskAsyncFunction): this {
    this.list.push({ title, type: TaskFunctionType.Async, fn });
    return this;
  }

  public addCallback(title: string, fn: TaskCallbackFunction): this {
    this.list.push({ title, type: TaskFunctionType.Callback, fn });
    return this;
  }

  protected async runTask(index: number): Promise<TaskResult> {
    const task = this.list[index];
    if (!task) return { ok: false, message: `task #${index} not exists` };
    try {
      let result: ExecTaskResult;
      switch (task.type) {
        case TaskFunctionType.Sync:
          result = await execSyncFunction(this.options.seconds, task.fn as TaskSyncFunction, this.options.concurrent);
          break;
        case TaskFunctionType.SyncFaster:
          result = await execSyncFasterFunction(
            this.options.seconds,
            task.fn as TaskSyncFunction,
            this.options.concurrent,
            task.params,
          );
          break;
        case TaskFunctionType.Async:
          result = await execAsyncFunction(this.options.seconds, task.fn as TaskAsyncFunction, this.options.concurrent);
          break;
        case TaskFunctionType.Callback:
          result = await execCallbackFunction(
            this.options.seconds,
            task.fn as TaskCallbackFunction,
            this.options.concurrent,
          );
          break;
        default:
          throw new Error(`invalid task type: ${task.type}`);
      }
      return { ok: true, message: "success", task, result };
    } catch (err) {
      return { ok: false, message: err.message, task };
    }
  }

  public async run(): Promise<Result> {
    const list: TaskResult[] = [];
    for (let i = 0; i < this.list.length; i++) {
      const t = this.list[i];
      await sleep(this.options.delay * 1000);
      console.log("start test #%d: %s", i, t.title);
      const ret = await this.runTask(i);
      list.push(ret);
      console.log("  - finish #%d", i);
    }
    console.log("done");
    this.result = { ...this.options, list };
    return this.result;
  }

  public print(result: Result | undefined = this.result): this {
    if (!result) {
      console.log(colors.red("Please run benchmark firstly"));
      return this;
    }
    const line = colors.gray("-".repeat(process.stdout.columns || 80));
    console.log("\n\n\n" + line);
    console.log(colors.bold.blue(this.options.title));
    console.log(line + "\n");
    console.log(colors.blue(platformInfo()));
    {
      const t = new Table({ head: ["test", "rps", "ns/op", "spent"] });
      const successTasks = result.list.filter(v => v.ok);
      successTasks.forEach(v => {
        const count = v.result!.count;
        const seconds = v.result!.seconds;
        const rps = count / seconds;
        const nsop = ((1 / rps) * 1000000000).toFixed(1);
        t.push([v.task!.title, rps.toFixed(1), nsop, `${seconds.toFixed(3)}s`]);
      });
      if (successTasks.length > 0) {
        console.log("\n");
        console.log(colors.blue("%s tests success:"), successTasks.length);
        console.log(colors.green(t.toString()));
      }
    }
    {
      const t = new Table({ head: ["test", "error"] });
      const failTasks = result.list.filter(v => !v.ok);
      failTasks.forEach(v => {
        t.push([v.task!.title, v.message]);
      });
      if (failTasks.length > 0) {
        console.log("\n");
        console.log(colors.blue("%s tests fail:"), failTasks.length);
        console.log(colors.red(t.toString()));
      }
    }
    return this;
  }
}
