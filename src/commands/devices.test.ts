import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'deviceType', columnType: 'DIMENSION' },
      { name: 'operatingSystem', columnType: 'DIMENSION' },
      { name: 'views', columnType: 'METRIC' },
      { name: 'estimatedMinutesWatched', columnType: 'METRIC' },
    ],
    rows: [
      ['MOBILE', 'ANDROID', 25000, 6000],
      ['DESKTOP', 'WINDOWS', 10000, 3000],
    ],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('devicesAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('dimensions: deviceType,operatingSystem, sort: -views로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { devicesAction } = await import('./devices');

    await devicesAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensions: 'deviceType,operatingSystem',
        metrics: 'views,estimatedMinutesWatched',
        sort: '-views',
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { devicesAction } = await import('./devices');

    await devicesAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(2);
  });
});
