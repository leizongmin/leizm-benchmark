# @leizm/benchmark

简单性能测试框架

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
  .run()
  .then(r => b.print(r))
  .catch(console.log);

function sleep(ms: number): Promise<number> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
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
