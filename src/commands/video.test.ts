import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'views', columnType: 'METRIC' },
      { name: 'estimatedMinutesWatched', columnType: 'METRIC' },
      { name: 'likes', columnType: 'METRIC' },
      { name: 'comments', columnType: 'METRIC' },
      { name: 'shares', columnType: 'METRIC' },
      { name: 'subscribersGained', columnType: 'METRIC' },
      { name: 'averageViewDuration', columnType: 'METRIC' },
    ],
    rows: [[50000, 25000, 3000, 200, 150, 500, 180]],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('videoAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('video==VIDEO_ID 필터로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { videoAction } = await import('./video');

    await videoAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      videoId: 'abc123xyz',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics:
          'views,estimatedMinutesWatched,likes,comments,shares,subscribersGained,averageViewDuration',
        filters: 'video==abc123xyz',
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { videoAction } = await import('./video');

    await videoAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      videoId: 'abc123xyz',
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(1);
  });
});
