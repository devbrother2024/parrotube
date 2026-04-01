import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'insightTrafficSourceDetail', columnType: 'DIMENSION' },
      { name: 'views', columnType: 'METRIC' },
      { name: 'estimatedMinutesWatched', columnType: 'METRIC' },
    ],
    rows: [
      ['typescript tutorial', 5000, 2500],
      ['bun runtime', 3000, 1500],
    ],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('searchTermsAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('YT_SEARCH 필터와 insightTrafficSourceDetail dimension으로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { searchTermsAction } = await import('./search-terms');

    await searchTermsAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      max: 25,
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: 'views,estimatedMinutesWatched',
        dimensions: 'insightTrafficSourceDetail',
        filters: 'insightTrafficSourceType==YT_SEARCH',
        sort: '-views',
        maxResults: 25,
      }),
    );
  });

  test('--max 옵션으로 maxResults 지정', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { searchTermsAction } = await import('./search-terms');

    await searchTermsAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      max: 10,
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({ maxResults: 10 }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { searchTermsAction } = await import('./search-terms');

    await searchTermsAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      max: 25,
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(2);
  });
});
