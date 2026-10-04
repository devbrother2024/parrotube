import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListJobs = mock(() =>
  Promise.resolve([
    {
      id: 'job-1',
      reportTypeId: 'channel_reach_basic_a1',
      name: 'reach basic',
      createTime: '2026-10-04T06:34:36Z',
    },
  ]),
);

mock.module('../reporting-api', () => ({
  listReportTypes: mock(() => Promise.resolve([])),
  listJobs: mockListJobs,
  createJob: mock(() => Promise.resolve({})),
  listReports: mock(() => Promise.resolve([])),
  downloadReport: mock(() => Promise.resolve('')),
}));

describe('reportingJobsAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListJobs.mockClear();
  });

  test('job 목록을 items로 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingJobsAction } = await import('./reporting-jobs');

    await reportingJobsAction({} as never, { format: 'json' });

    expect(mockListJobs).toHaveBeenCalledTimes(1);
    const printed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(printed.items[0].id).toBe('job-1');
  });
});
