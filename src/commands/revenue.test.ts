import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'estimatedRevenue', columnType: 'METRIC' },
      { name: 'estimatedAdRevenue', columnType: 'METRIC' },
      { name: 'estimatedRedPartnerRevenue', columnType: 'METRIC' },
      { name: 'grossRevenue', columnType: 'METRIC' },
      { name: 'cpm', columnType: 'METRIC' },
      { name: 'adImpressions', columnType: 'METRIC' },
      { name: 'monetizedPlaybacks', columnType: 'METRIC' },
    ],
    rows: [[120.5, 100.3, 20.2, 150.0, 4.5, 33000, 25000]],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('revenueAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('수익 관련 metrics로 호출 (dimensions 없음)', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { revenueAction } = await import('./revenue');

    await revenueAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics:
          'estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue,grossRevenue,cpm,adImpressions,monetizedPlaybacks',
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { revenueAction } = await import('./revenue');

    await revenueAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(1);
  });
});
