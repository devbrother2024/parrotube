import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [
      { name: 'sharingService', columnType: 'DIMENSION' },
      { name: 'shares', columnType: 'METRIC' },
    ],
    rows: [
      ['WHATSAPP', 500],
      ['TWITTER', 300],
      ['LINE', 150],
    ],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('sharingAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('dimensions: sharingService, metrics: shares, sort: -shares로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { sharingAction } = await import('./sharing');

    await sharingAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    expect(mockQueryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: 'shares',
        dimensions: 'sharingService',
        sort: '-shares',
      }),
    );
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { sharingAction } = await import('./sharing');

    await sharingAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(parsed.rows).toHaveLength(3);
  });
});
