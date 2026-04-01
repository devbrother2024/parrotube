import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'day', columnType: 'DIMENSION' },
      { name: 'views', columnType: 'METRIC' },
      { name: 'estimatedMinutesWatched', columnType: 'METRIC' },
      { name: 'likes', columnType: 'METRIC' },
      { name: 'subscribersGained', columnType: 'METRIC' },
      { name: 'averageViewDuration', columnType: 'METRIC' },
    ],
    rows: [
      ['2026-03-30', 1000, 500, 50, 10, 120],
      ['2026-03-31', 1200, 600, 60, 12, 130],
    ],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('timeSeriesAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('기본 dimensions: day, sort: day로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { timeSeriesAction } = await import('./time-series');

    await timeSeriesAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      by: 'day',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: 'views,estimatedMinutesWatched,likes,subscribersGained,averageViewDuration',
        dimensions: 'day',
        sort: 'day',
      }),
    );
  });

  test('--by month 옵션으로 월별 조회', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { timeSeriesAction } = await import('./time-series');

    await timeSeriesAction({} as never, {
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      format: 'json',
      by: 'month',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensions: 'month',
        sort: 'month',
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { timeSeriesAction } = await import('./time-series');

    await timeSeriesAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      by: 'day',
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(2);
  });
});
