import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'country', columnType: 'DIMENSION' },
      { name: 'views', columnType: 'METRIC' },
    ],
    rows: [
      ['KR', 10000],
      ['US', 5000],
    ],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('queryAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('사용자 지정 metrics/dimensions/sort/filters/maxResults로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { queryAction } = await import('./query');

    await queryAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      metrics: 'views',
      dimensions: 'country',
      sort: '-views',
      filters: 'continent==Asia',
      maxResults: 50,
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: 'views',
        dimensions: 'country',
        sort: '-views',
        filters: 'continent==Asia',
        maxResults: 50,
      }),
    );
  });

  test('선택 파라미터 생략 시 undefined 전달', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { queryAction } = await import('./query');

    await queryAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      metrics: 'views',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: 'views',
        dimensions: undefined,
        sort: undefined,
        filters: undefined,
        maxResults: undefined,
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { queryAction } = await import('./query');

    await queryAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      metrics: 'views',
      dimensions: 'country',
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(2);
  });
});
