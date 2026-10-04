import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListReportTypes = mock(() =>
  Promise.resolve([
    { id: 'channel_reach_basic_a1', name: 'Reach basic' },
    { id: 'channel_reach_combined_a1', name: 'Reach combined' },
  ]),
);

mock.module('../reporting-api', () => ({
  listReportTypes: mockListReportTypes,
  listJobs: mock(() => Promise.resolve([])),
  createJob: mock(() => Promise.resolve({})),
  listReports: mock(() => Promise.resolve([])),
  downloadReport: mock(() => Promise.resolve('')),
}));

describe('reportingTypesAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListReportTypes.mockClear();
  });

  test('리포트 유형 목록을 items로 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingTypesAction } = await import('./reporting-types');

    await reportingTypesAction({} as never, { format: 'json' });

    expect(mockListReportTypes).toHaveBeenCalledTimes(1);
    const printed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(printed.items.map((t: { id: string }) => t.id)).toEqual([
      'channel_reach_basic_a1',
      'channel_reach_combined_a1',
    ]);
  });
});
