/**
 * @leizm/benchmark
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import util from "util";
import colors from "colors";

export function log(...args: any[]) {
  console.log(colors.gray("\t%s"), util.format.apply(util, args as any));
}
