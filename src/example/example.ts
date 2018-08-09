import Benchmark from "../lib";
import sleep from "../lib/sleep";

const b = new Benchmark({ title: "Benchmark Example" });
b.addAsync("async task", async () => await sleep(0))
  .addCallback("callback task", done => sleep(0).then(done))
  .addSync("sync task", () => 1 + 1)
  .run()
  .then(r => {
    // console.log(r);
    b.print(r);
  })
  .catch(console.log);
