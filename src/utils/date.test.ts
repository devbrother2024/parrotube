import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { parsePeriod, resolveDates } from './date';

describe('parsePeriod', () => {
  let realDate: typeof Date;

  beforeEach(() => {
    realDate = globalThis.Date;
    const fixed = new Date('2026-04-01T00:00:00Z');
    globalThis.Date = class extends realDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(fixed.getTime());
        } else {
          // @ts-expect-error -- spread to Date constructor
          super(...args);
        }
      }

      static now() {
        return fixed.getTime();
      }
    } as DateConstructor;
  });

  afterEach(() => {
    globalThis.Date = realDate;
  });

  test('7d -> 7일 전부터 오늘까지', () => {
    const result = parsePeriod('7d');
    expect(result.startDate).toBe('2026-03-25');
    expect(result.endDate).toBe('2026-04-01');
  });

  test('28d -> 28일 전부터 오늘까지', () => {
    const result = parsePeriod('28d');
    expect(result.startDate).toBe('2026-03-04');
    expect(result.endDate).toBe('2026-04-01');
  });

  test('90d -> 90일 전부터 오늘까지', () => {
    const result = parsePeriod('90d');
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-04-01');
  });

  test('1y -> 365일 전부터 오늘까지', () => {
    const result = parsePeriod('1y');
    expect(result.startDate).toBe('2025-04-01');
    expect(result.endDate).toBe('2026-04-01');
  });

  test('알 수 없는 period는 에러', () => {
    expect(() => parsePeriod('999x')).toThrow('Unknown period');
  });
});

describe('resolveDates', () => {
  test('startDate + endDate가 명시되면 그대로 반환', () => {
    const result = resolveDates({
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-03-31');
  });

  test('period만 있으면 parsePeriod 호출', () => {
    const result = resolveDates({ period: '7d' });
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();
  });

  test('아무것도 없으면 기본값 28d', () => {
    const result = resolveDates({});
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();
  });
});
