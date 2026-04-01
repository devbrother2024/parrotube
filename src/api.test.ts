import { describe, expect, test, mock } from 'bun:test';

const mockQuery = mock(() =>
  Promise.resolve({
    data: {
      columnHeaders: [
        { name: 'country', columnType: 'DIMENSION' },
        { name: 'views', columnType: 'METRIC' },
      ],
      rows: [['KR', 500]],
    },
  }),
);

mock.module('googleapis', () => ({
  google: {
    youtubeAnalytics: () => ({
      reports: { query: mockQuery },
    }),
  },
}));

describe('queryReport', () => {
  test('metrics, dimensions, dates를 전달하여 API 호출', async () => {
    const { queryReport } = await import('./api');
    const fakeAuth = {} as never;

    const result = await queryReport({
      auth: fakeAuth,
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      metrics: 'views',
      dimensions: 'country',
    });

    expect(mockQuery).toHaveBeenCalledWith({
      ids: 'channel==MINE',
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      metrics: 'views',
      dimensions: 'country',
      sort: undefined,
      filters: undefined,
      maxResults: undefined,
    });
    expect(result.columnHeaders).toBeDefined();
    expect(result.rows).toEqual([['KR', 500]]);
  });

  test('sort, filters, maxResults 옵션 전달', async () => {
    const { queryReport } = await import('./api');
    const fakeAuth = {} as never;

    await queryReport({
      auth: fakeAuth,
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'country',
      sort: '-views',
      filters: 'country==KR',
      maxResults: 5,
    });

    expect(mockQuery).toHaveBeenLastCalledWith({
      ids: 'channel==MINE',
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'country',
      sort: '-views',
      filters: 'country==KR',
      maxResults: 5,
    });
  });

  test('dimensions 없이 호출 가능 (overview용)', async () => {
    const { queryReport } = await import('./api');
    const fakeAuth = {} as never;

    const result = await queryReport({
      auth: fakeAuth,
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      metrics: 'views,likes',
    });

    expect(result).toBeDefined();
  });
});
