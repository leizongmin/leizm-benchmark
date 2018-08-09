/**
 * @leizm/benchmark
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

export default function sleep(ms: number): Promise<number> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
