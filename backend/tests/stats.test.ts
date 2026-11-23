import { describe, expect, it } from 'vitest';
import { groupBy, histogram, median, summarize } from '../src/stats';

describe('median', () => {
  it('returns the middle value for odd counts', () => expect(median([5, 1, 3])).toBe(3));
  it('averages the two middle values for even counts', () => expect(median([4, 1, 3, 2])).toBe(2.5));
  it('does not mutate its input', () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
  it('throws on empty input', () => expect(() => median([])).toThrow());
});

describe('summarize', () => {
  it('computes count, min, max, avg, median and total', () => {
    expect(summarize([10, 20, 30, 40])).toEqual({ count: 4, min: 10, max: 40, avg: 25, median: 25, total: 100 });
  });
  it('handles a single value', () => {
    expect(summarize([7])).toMatchObject({ count: 1, min: 7, max: 7, avg: 7, median: 7 });
  });
});

describe('groupBy', () => {
  it('groups items by key', () => {
    const g = groupBy([{ k: 'a', v: 1 }, { k: 'b', v: 2 }, { k: 'a', v: 3 }], (x) => x.k);
    expect(g.get('a')!.map((x) => x.v)).toEqual([1, 3]);
    expect(g.get('b')!.length).toBe(1);
  });
});

describe('histogram', () => {
  it('buckets values and keeps empty buckets in between', () => {
    expect(histogram([1, 2, 25], 10)).toEqual([
      { from: 0, to: 10, count: 2 },
      { from: 10, to: 20, count: 0 },
      { from: 20, to: 30, count: 1 },
    ]);
  });
  it('puts a boundary value in the upper bucket', () => {
    expect(histogram([10], 10).map((b) => b.count)).toEqual([0, 1]);
  });
  it('returns empty for no values and rejects bad width', () => {
    expect(histogram([], 10)).toEqual([]);
    expect(() => histogram([1], 0)).toThrow();
  });
});
