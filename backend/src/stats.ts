/** Pure statistics helpers. No I/O, so they are trivially unit-testable. */

export function median(values: number[]): number {
  if (values.length === 0) throw new Error('median of empty list');
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface Summary {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  total: number;
}

export function summarize(values: number[]): Summary {
  if (values.length === 0) throw new Error('summarize of empty list');
  let min = values[0];
  let max = values[0];
  let total = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    total += v;
  }
  return { count: values.length, min, max, avg: total / values.length, median: median(values), total };
}

export function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = groups.get(k);
    if (list) list.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

export interface Bucket {
  from: number;
  to: number;
  count: number;
}

/** Fixed-width histogram starting at 0. Empty buckets in the middle are kept so charts have no gaps. */
export function histogram(values: number[], width: number): Bucket[] {
  if (width <= 0) throw new Error('bucket width must be positive');
  if (values.length === 0) return [];
  const last = Math.floor(Math.max(...values) / width);
  const buckets: Bucket[] = Array.from({ length: last + 1 }, (_, i) => ({
    from: i * width,
    to: (i + 1) * width,
    count: 0,
  }));
  for (const v of values) buckets[Math.floor(v / width)].count++;
  return buckets;
}
