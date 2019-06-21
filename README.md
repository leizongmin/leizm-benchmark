# @leizm/benchmark

简单性能测试框架，支持预热和多进程执行（针对异步任务）。

## 安装

```bash
npm i @leizm/benchmark -S
```

## 用法

```typescript
import Benchmark from "@leizm/benchmark";

const b = new Benchmark({ title: "Benchmark Example" });
b.addAsync("async task", async () => await sleep(0))
  .addCallback("callback task", done => sleep(0).then(done))
  .addSync("sync task", () => 1 + 1)
  .addSyncFaster("sync faster task", count => {
    for (let i = 0; i < count; i++) {
      // ... 针对性能损坏极小的同步任务，使用 for 来循环 count 次
    }
  })
  .runAndPrint();

function sleep(ms: number): Promise<number> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
```

**注意：`addAsync()` 和 `addCallback()` 中的任务必须是真正的异步函数，否则可能造成进程卡死**

## 选项

```typescript
export interface Options {
  /** 标题 */
  title: string;
  /** 每个任务执行时长（秒） */
  seconds: number;
  /** 并发数量（异步任务时有效） */
  concurrent: number;
  /** 每个任务间隔（秒） */
  delay: number;
  /** 预热时间（秒） */
  preheat: number;
  /** 是否开启多进程，默认不开启 */
  clusterMode: boolean;
  /** 子进程数量，默认为CPU总数 */
  clusterCount: number;
}
```

## License

```text
MIT License

Copyright (c) 2018 Zongmin Lei <leizongmin@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
