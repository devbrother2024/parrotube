import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'views', columnType: 'METRIC' },
      { name: 'estimatedMinutesWatched', columnType: 'METRIC' },
      { name: 'likes', columnType: 'METRIC' },
      { name: 'subscribersGained', columnType: 'METRIC' },
      { name: 'averageViewDuration', columnType: 'METRIC' },
    ],
    rows: [[50000, 12000, 3000, 150, 245]],
  }),
);

mock.module('../api', () => ({
  queryReport: mockQueryReport,
}));

describe('overviewAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('올바른 metrics로 queryReport 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { overviewAction } = await import('./overview');
    const fakeAuth = {} as never;

    await overviewAction(fakeAuth, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics:
          'views,estimatedMinutesWatched,likes,subscribersGained,averageViewDuration',
      }),
    );
  });

  test('dimensions 없이 호출 (채널 전체 요약)', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { overviewAction } = await import('./overview');
    const fakeAuth = {} as never;

    await overviewAction(fakeAuth, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    const callArgs = mockQueryReport.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.dimensions).toBeUndefined();
  });

  test('json 포맷으로 결과 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { overviewAction } = await import('./overview');
    const fakeAuth = {} as never;

    await overviewAction(fakeAuth, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const printed = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(printed);
    expect(parsed.rows[0]).toEqual([50000, 12000, 3000, 150, 245]);
  });
});
