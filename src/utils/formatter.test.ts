import { describe, expect, test, beforeEach, afterEach, spyOn } from 'bun:test';
import { output, formatReport } from './formatter';

describe('output', () => {
  let stdoutSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stdoutSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  test('json 포맷: JSON.stringify로 출력', () => {
    const data = { foo: 'bar' };
    output(data, 'json');
    expect(stdoutSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
  });

  test('기본값은 json 포맷', () => {
    const data = { x: 1 };
    output(data);
    expect(stdoutSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
  });

  test('table 포맷: 테이블 문자열 출력', () => {
    const data = {
      columnHeaders: [
        { name: 'country', columnType: 'DIMENSION' },
        { name: 'views', columnType: 'METRIC' },
      ],
      rows: [
        ['KR', 12345],
        ['US', 6789],
      ],
    };
    output(data, 'table');
    const printed = stdoutSpy.mock.calls[0][0] as string;
    expect(printed).toContain('country');
    expect(printed).toContain('views');
    expect(printed).toContain('KR');
  });

  test('table 포맷: rows가 없으면 빈 테이블', () => {
    output({}, 'table');
    expect(stdoutSpy).toHaveBeenCalled();
  });
});

describe('formatReport', () => {
  test('columnHeaders + rows를 객체 배열로 변환', () => {
    const apiResponse = {
      columnHeaders: [
        { name: 'country', columnType: 'DIMENSION' },
        { name: 'views', columnType: 'METRIC' },
      ],
      rows: [
        ['KR', 100],
        ['US', 200],
      ],
    };
    const result = formatReport(apiResponse);
    expect(result).toEqual([
      { country: 'KR', views: 100 },
      { country: 'US', views: 200 },
    ]);
  });

  test('rows가 비어있으면 빈 배열 반환', () => {
    const apiResponse = {
      columnHeaders: [{ name: 'views', columnType: 'METRIC' }],
      rows: [],
    };
    expect(formatReport(apiResponse)).toEqual([]);
  });

  test('rows가 없으면 빈 배열 반환', () => {
    expect(formatReport({})).toEqual([]);
    expect(formatReport(null)).toEqual([]);
  });
});
