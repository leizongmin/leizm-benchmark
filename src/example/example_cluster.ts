import Benchmark, { sleep } from "../lib";

const b = new Benchmark({ title: "Benchmark Example", clusterMode: true, clusterCount: 2, preheat: 1 });
b.addAsync("async task", async () => await sleep(0))
  .addCallback("callback task", done => sleep(0).then(done))
  .addSync("sync task", () => 1 + 1)
  .addSyncFaster("sync faster task", count => {
    let x;
    for (let i = 0; i < count; i++) {
      x = i + 1;
    }
    return x;
  })
  .runAndPrint();
