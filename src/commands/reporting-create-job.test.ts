import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const existingJob = {
  id: 'job-existing',
  reportTypeId: 'channel_reach_basic_a1',
  name: 'reach basic',
  createTime: '2026-10-04T06:34:36Z',
};

const mockListJobs = mock(() => Promise.resolve([existingJob]));
const mockCreateJob = mock((params: { reportTypeId: string; name: string }) =>
  Promise.resolve({
    id: 'job-new',
    reportTypeId: params.reportTypeId,
    name: params.name,
    createTime: '2026-10-04T07:00:00Z',
  }),
);

mock.module('../reporting-api', () => ({
  listReportTypes: mock(() => Promise.resolve([])),
  listJobs: mockListJobs,
  createJob: mockCreateJob,
  listReports: mock(() => Promise.resolve([])),
  downloadReport: mock(() => Promise.resolve('')),
}));

describe('reportingCreateJobAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListJobs.mockClear();
    mockCreateJob.mockClear();
  });

  test('같은 리포트 유형의 job이 없으면 새로 만들고 created=true로 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingCreateJobAction } = await import('./reporting-create-job');

    await reportingCreateJobAction({} as never, {
      format: 'json',
      reportType: 'channel_reach_combined_a1',
      name: 'reach combined',
    });

    expect(mockCreateJob).toHaveBeenCalledWith(
      expect.objectContaining({ reportTypeId: 'channel_reach_combined_a1', name: 'reach combined' }),
    );
    const printed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(printed.created).toBe(true);
    expect(printed.items[0].id).toBe('job-new');
  });

  test('이름을 생략하면 리포트 유형 ID를 job 이름으로 쓴다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingCreateJobAction } = await import('./reporting-create-job');

    await reportingCreateJobAction({} as never, {
      format: 'json',
      reportType: 'channel_reach_combined_a1',
    });

    expect(mockCreateJob).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'channel_reach_combined_a1' }),
    );
  });

  test('같은 리포트 유형의 job이 이미 있으면 만들지 않고 기존 job을 created=false로 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingCreateJobAction } = await import('./reporting-create-job');

    await reportingCreateJobAction({} as never, {
      format: 'json',
      reportType: 'channel_reach_basic_a1',
    });

    expect(mockCreateJob).not.toHaveBeenCalled();
    const printed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(printed.created).toBe(false);
    expect(printed.items[0].id).toBe('job-existing');
  });
});
