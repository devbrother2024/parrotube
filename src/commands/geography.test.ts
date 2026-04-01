import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'country', columnType: 'DIMENSION' },
      { name: 'views', columnType: 'METRIC' },
      { name: 'estimatedMinutesWatched', columnType: 'METRIC' },
    ],
    rows: [
      ['KR', 30000, 8000],
      ['US', 12000, 3500],
    ],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('geographyAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('dimensions: country, sort: -estimatedMinutesWatched로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { geographyAction } = await import('./geography');

    await geographyAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensions: 'country',
        metrics: 'views,estimatedMinutesWatched',
        sort: '-estimatedMinutesWatched',
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { geographyAction } = await import('./geography');

    await geographyAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(2);
  });
});
