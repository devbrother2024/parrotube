import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'video', columnType: 'DIMENSION' },
      { name: 'estimatedMinutesWatched', columnType: 'METRIC' },
      { name: 'views', columnType: 'METRIC' },
      { name: 'likes', columnType: 'METRIC' },
      { name: 'subscribersGained', columnType: 'METRIC' },
    ],
    rows: [
      ['abc123', 8000, 20000, 1500, 80],
      ['def456', 5000, 12000, 800, 40],
    ],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('topVideosAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('dimensions: video, sort: -estimatedMinutesWatched, 기본 maxResults: 10', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { topVideosAction } = await import('./top-videos');

    await topVideosAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      max: 10,
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensions: 'video',
        metrics: 'estimatedMinutesWatched,views,likes,subscribersGained',
        sort: '-estimatedMinutesWatched',
        maxResults: 10,
      }),
    );
  });

  test('--max 옵션으로 maxResults 지정', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { topVideosAction } = await import('./top-videos');

    await topVideosAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      max: 5,
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({ maxResults: 5 }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { topVideosAction } = await import('./top-videos');

    await topVideosAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      max: 10,
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(2);
  });
});
