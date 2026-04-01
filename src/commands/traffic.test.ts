import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'insightTrafficSourceType', columnType: 'DIMENSION' },
      { name: 'views', columnType: 'METRIC' },
      { name: 'estimatedMinutesWatched', columnType: 'METRIC' },
    ],
    rows: [
      ['YT_SEARCH', 20000, 5000],
      ['SUGGESTED', 15000, 4000],
    ],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('trafficAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('dimensions: insightTrafficSourceType, sort: -views로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { trafficAction } = await import('./traffic');

    await trafficAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensions: 'insightTrafficSourceType',
        metrics: 'views,estimatedMinutesWatched',
        sort: '-views',
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { trafficAction } = await import('./traffic');

    await trafficAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(2);
  });
});
