import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'ageGroup', columnType: 'DIMENSION' },
      { name: 'gender', columnType: 'DIMENSION' },
      { name: 'viewerPercentage', columnType: 'METRIC' },
    ],
    rows: [
      ['age25-34', 'male', 35.2],
      ['age25-34', 'female', 22.1],
    ],
  }),
);

mock.module('../api', () => ({
  queryReport: mockQueryReport,
}));

describe('demographicsAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('dimensions: ageGroup,gender / metrics: viewerPercentage로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { demographicsAction } = await import('./demographics');

    await demographicsAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: 'viewerPercentage',
        dimensions: 'ageGroup,gender',
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { demographicsAction } = await import('./demographics');

    await demographicsAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(2);
  });
});
