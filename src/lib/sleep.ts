/**
 * @leizm/benchmark
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

export function sleep(ms: number): Promise<number> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
