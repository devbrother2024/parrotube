import { describe, expect, test, mock, afterEach } from 'bun:test';

const mockReportTypesList = mock((params: { pageToken?: string }) =>
  Promise.resolve({
    data: params.pageToken
      ? { reportTypes: [{ id: 'channel_reach_combined_a1', name: 'Reach combined' }] }
      : {
          reportTypes: [{ id: 'channel_reach_basic_a1', name: 'Reach basic' }],
          nextPageToken: 'page-2',
        },
  }),
);

const mockJobsList = mock(() =>
  Promise.resolve({
    data: {
      jobs: [
        {
          id: 'job-1',
          reportTypeId: 'channel_reach_basic_a1',
          name: 'reach basic',
          createTime: '2026-10-04T06:34:36Z',
        },
      ],
    },
  }),
);

const mockJobsCreate = mock(() =>
  Promise.resolve({
    data: {
      id: 'job-new',
      reportTypeId: 'channel_reach_basic_a1',
      name: 'reach basic',
      createTime: '2026-10-04T06:34:36Z',
    },
  }),
);

const mockReportsList = mock((params: { pageToken?: string }) =>
  Promise.resolve({
    data: params.pageToken
      ? { reports: [{ id: 'report-2', startTime: '2026-09-05T07:00:00Z' }] }
      : { reports: [{ id: 'report-1', startTime: '2026-09-04T07:00:00Z' }], nextPageToken: 'page-2' },
  }),
);

mock.module('googleapis', () => ({
  google: {
    youtubereporting: () => ({
      reportTypes: { list: mockReportTypesList },
      jobs: {
        list: mockJobsList,
        create: mockJobsCreate,
        reports: { list: mockReportsList },
      },
    }),
  },
}));

describe('reporting-api', () => {
  afterEach(() => {
    mockReportTypesList.mockClear();
    mockJobsList.mockClear();
    mockJobsCreate.mockClear();
    mockReportsList.mockClear();
  });

  test('listReportTypes는 모든 페이지의 리포트 유형을 모은다', async () => {
    const { listReportTypes } = await import('./reporting-api');

    const types = await listReportTypes({ auth: {} as never });

    expect(types.map((t) => t.id)).toEqual(['channel_reach_basic_a1', 'channel_reach_combined_a1']);
    expect(mockReportTypesList).toHaveBeenCalledTimes(2);
    expect(mockReportTypesList.mock.calls[1][0]).toEqual(expect.objectContaining({ pageToken: 'page-2' }));
  });

  test('listJobs는 job 목록을 반환한다', async () => {
    const { listJobs } = await import('./reporting-api');

    const jobs = await listJobs({ auth: {} as never });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].reportTypeId).toBe('channel_reach_basic_a1');
  });

  test('listJobs는 jobs 키가 없으면 빈 배열을 반환한다', async () => {
    mockJobsList.mockImplementationOnce(() => Promise.resolve({ data: {} }) as never);
    const { listJobs } = await import('./reporting-api');

    expect(await listJobs({ auth: {} as never })).toEqual([]);
  });

  test('createJob은 리포트 유형과 이름으로 job을 만든다', async () => {
    const { createJob } = await import('./reporting-api');

    const job = await createJob({
      auth: {} as never,
      reportTypeId: 'channel_reach_basic_a1',
      name: 'reach basic',
    });

    expect(mockJobsCreate).toHaveBeenCalledWith({
      requestBody: { reportTypeId: 'channel_reach_basic_a1', name: 'reach basic' },
    });
    expect(job.id).toBe('job-new');
  });

  test('listReports는 jobId로 모든 페이지의 리포트를 모은다', async () => {
    const { listReports } = await import('./reporting-api');

    const reports = await listReports({ auth: {} as never, jobId: 'job-1' });

    expect(reports.map((r) => r.id)).toEqual(['report-1', 'report-2']);
    expect(mockReportsList.mock.calls[0][0]).toEqual(expect.objectContaining({ jobId: 'job-1' }));
    expect(mockReportsList.mock.calls[1][0]).toEqual(
      expect.objectContaining({ jobId: 'job-1', pageToken: 'page-2' }),
    );
  });

  test('downloadReport는 인증된 요청으로 downloadUrl의 CSV 본문을 받는다', async () => {
    const mockRequest = mock(() => Promise.resolve({ data: 'date,video_id\n20260904,abc\n' }));
    const { downloadReport } = await import('./reporting-api');

    const csv = await downloadReport({
      auth: { request: mockRequest } as never,
      downloadUrl: 'https://youtubereporting.googleapis.com/v1/media/CHANNEL/report-1?alt=media',
    });

    expect(mockRequest).toHaveBeenCalledWith({
      url: 'https://youtubereporting.googleapis.com/v1/media/CHANNEL/report-1?alt=media',
      responseType: 'text',
    });
    expect(csv).toBe('date,video_id\n20260904,abc\n');
  });
});
