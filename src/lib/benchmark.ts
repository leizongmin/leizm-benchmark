/**
 * @leizm/benchmark
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import cluster from "cluster";
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
  mergeResults,
} from "./base";
import { log } from "./log";

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

  /**
   * 开始执行
   */
  public async run(): Promise<Result> {
    if (this.options.clusterMode) {
      if (cluster.isMaster) {
        return this.runOnMasterMode();
      } else {
        return this.runOnClusterMode();
      }
    } else {
      return this.runOnNormalMode();
    }
  }

  /**
   * 执行并打印结果，然后退出
   */
  public async runAndPrint() {
    if (this.options.clusterMode && cluster.isWorker) {
      await this.run();
      process.exit();
    } else {
      try {
        const result = await this.run();
        await sleep(1000);
        this.print(result);
      } catch (err) {
        log(err);
      }
      await sleep(0);
      process.exit();
    }
  }

  protected async runOnMasterMode(): Promise<Result> {
    log("start cluster mode, cluster count is %s", this.options.clusterCount);
    const concurrent = Math.ceil(this.options.concurrent / this.options.clusterCount);
    const workerList: cluster.Worker[] = [];
    const resultList: Result[] = [];
    const waitList: Promise<any>[] = [];
    const fork = (id: number) => {
      return new Promise(resolve => {
        const p = cluster.fork();
        workerList.push(p);
        log("  - cluster #%s, PID is %s", id, p.process.pid);
        p.on("message", msg => {
          if (msg.type === "ready") {
            log("  - cluster #%s, ready", id);
            p.send({ type: "start", data: { concurrent } });
          } else if (msg.type === "result") {
            resultList.push(msg.data);
            resolve();
          } else if (msg.type === "error") {
            log("  - cluster #%s, error: %s", id, msg.data);
          } else {
            log("  - cluster #%s, message: %j", id, msg);
          }
        });
        p.on("error", err => {
          log("  - cluster #%s, error:", id, err);
        });
        p.on("exit", () => {
          log("  - cluster #%s, exited", id);
        });
      });
    };
    for (let i = 0; i < this.options.clusterCount; i++) {
      waitList.push(fork(i + 1));
    }
    await Promise.all(waitList);
    workerList.forEach(w => w.kill());
    resultList.forEach(r => log(r.list));
    this.result = mergeResults(resultList);
    log(this.result.list);
    return this.result;
  }

  protected async runOnClusterMode(): Promise<Result> {
    return new Promise((resolve, reject) => {
      log("cluster PID#%s ready", process.pid);
      process.send!({ type: "ready" });
      process.on("message", msg => {
        if (msg.type === "start") {
          const { concurrent } = msg.data;
          log("cluster PID#%s start, concurrent is %s", process.pid, concurrent);
          this.options.concurrent = concurrent;
          this.runOnNormalMode()
            .then(result => {
              process.send!({ type: "result", data: result });
              resolve(result);
            })
            .catch(err => {
              process.send!({ type: "error", data: err });
              reject(err);
            });
        } else {
          log("cluster PID#%s start, message: %j", process.pid, msg);
        }
      });
    });
  }

  protected async runOnNormalMode(): Promise<Result> {
    const list: TaskResult[] = [];
    for (let i = 0; i < this.list.length; i++) {
      const t = this.list[i];
      await sleep(this.options.delay * 1000);
      log("start test #%d: %s", i, t.title);
      const ret = await this.runTask(i);
      list.push(ret);
      log("  - finish #%d", i);
    }
    log("done");
    this.result = { ...this.options, list };
    return this.result;
  }

  /**
   * 打印结果
   * @param result
   */
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
        let seconds = v.result!.seconds;
        let rps = count / seconds;
        const nsop = ((1 / rps) * 1000000000).toFixed(1);
        if (this.options.clusterMode) {
          t.push([
            v.task!.title,
            (rps * this.options.clusterCount).toFixed(1),
            nsop,
            `${(seconds / this.options.clusterCount).toFixed(3)}s`,
          ]);
        } else {
          t.push([v.task!.title, rps.toFixed(1), nsop, `${seconds.toFixed(3)}s`]);
        }
      });
      if (successTasks.length > 0) {
        console.log("\n");
        console.log(colors.blue("%s tests success"), successTasks.length);
        if (this.options.clusterMode) {
          console.log(colors.blue("total %s cluster"), this.options.clusterCount);
        }
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
