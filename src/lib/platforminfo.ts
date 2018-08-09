/**
 * @leizm/benchmark
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import * as os from "os";

export default function platformInfo(): string {
  const lines = [];
  lines.push("Platform info:");
  lines.push("- " + os.type() + " " + os.release() + " " + os.arch());
  lines.push("- " + "Node.JS: " + process.versions.node);
  lines.push("- " + "V8: " + process.versions.v8);
  let cpus = os
    .cpus()
    .map(function(cpu) {
      return cpu.model;
    })
    .reduce(function(o: any, model: string) {
      if (!o[model]) o[model] = 0;
      o[model]++;
      return o;
    }, {});
  cpus = Object.keys(cpus)
    .map(function(key) {
      return key + " \u00d7 " + cpus[key];
    })
    .join("\n");
  lines.push("  " + cpus);
  return lines.join("\n");
}
