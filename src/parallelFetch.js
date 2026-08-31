export async function mapWithConcurrency(items, concurrency, fn, callbacks = {}) {
  const { onStart, onComplete } = callbacks;
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      const item = items[current];
      onStart?.(item, current);
      results[current] = await fn(item, current);
      onComplete?.(item, current, results[current]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
