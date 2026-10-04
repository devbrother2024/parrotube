import { describe, expect, test, mock, spyOn, afterEach, beforeEach } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const jobs = [
  { id: 'job-basic', reportTypeId: 'channel_reach_basic_a1', name: 'reach basic' },
  { id: 'job-combined', reportTypeId: 'channel_reach_combined_a1', name: 'reach combined' },
];

const reportsByJob: Record<string, Record<string, string>[]> = {
  'job-basic': [
    {
      id: '101',
      jobId: 'job-basic',
      startTime: '2026-09-04T07:00:00Z',
      endTime: '2026-09-05T07:00:00Z',
      createTime: '2026-10-05T10:00:00Z',
      downloadUrl: 'https://example.test/media/101',
    },
    {
      id: '102',
      jobId: 'job-basic',
      startTime: '2026-09-05T07:00:00Z',
      endTime: '2026-09-06T07:00:00Z',
      createTime: '2026-10-05T11:00:00Z',
      downloadUrl: 'https://example.test/media/102',
    },
  ],
  'job-combined': [
    {
      id: '201',
      jobId: 'job-combined',
      startTime: '2026-09-04T07:00:00Z',
      endTime: '2026-09-05T07:00:00Z',
      createTime: '2026-10-05T12:00:00Z',
      downloadUrl: 'https://example.test/media/201',
    },
  ],
};

const mockListJobs = mock(() => Promise.resolve(jobs));
const mockListReports = mock((params: { jobId: string }) =>
  Promise.resolve(reportsByJob[params.jobId] ?? []),
);
const mockDownloadReport = mock((params: { downloadUrl: string }) =>
  Promise.resolve(`date,video_id\n${params.downloadUrl.split('/').pop()},abc\n`),
);

mock.module('../reporting-api', () => ({
  listReportTypes: mock(() => Promise.resolve([])),
  createJob: mock(() => Promise.resolve({})),
  listJobs: mockListJobs,
  listReports: mockListReports,
  downloadReport: mockDownloadReport,
}));

function readManifest(outDir: string): Record<string, unknown>[] {
  return fs
    .readFileSync(path.join(outDir, 'manifest.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

describe('reportingDownloadAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;
  let outDir: string;

  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parrotube-reporting-'));
  });

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListJobs.mockClear();
    mockListReports.mockClear();
    mockDownloadReport.mockClear();
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  test('새 리포트를 리포트 유형별 폴더에 날짜-리포트ID.csv로 저장하고 manifest에 기록한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingDownloadAction } = await import('./reporting-download');

    await reportingDownloadAction({} as never, { format: 'json', out: outDir });

    const basicFile = path.join(outDir, 'channel_reach_basic_a1', '20260904-101.csv');
    expect(fs.readFileSync(basicFile, 'utf8')).toBe('date,video_id\n101,abc\n');
    expect(fs.existsSync(path.join(outDir, 'channel_reach_combined_a1', '20260904-201.csv'))).toBe(true);

    const manifest = readManifest(outDir);
    expect(manifest).toHaveLength(3);
    expect(manifest[0]).toEqual(
      expect.objectContaining({
        reportId: '101',
        jobId: 'job-basic',
        reportTypeId: 'channel_reach_basic_a1',
        startTime: '2026-09-04T07:00:00Z',
        createTime: '2026-10-05T10:00:00Z',
        file: 'channel_reach_basic_a1/20260904-101.csv',
        bytes: Buffer.byteLength('date,video_id\n101,abc\n'),
      }),
    );
    expect(fs.readdirSync(path.join(outDir, 'channel_reach_basic_a1')).some((f) => f.endsWith('.part'))).toBe(false);
  });

  test('요약은 job별 리포트 수, 새로 받은 수, 최신 시작일을 담는다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingDownloadAction } = await import('./reporting-download');

    await reportingDownloadAction({} as never, { format: 'json', out: outDir });

    const summary = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(summary.outDir).toBe(outDir);
    expect(summary.downloaded).toBe(3);
    expect(summary.skipped).toBe(0);
    expect(summary.items[0]).toEqual(
      expect.objectContaining({
        jobId: 'job-basic',
        reportTypeId: 'channel_reach_basic_a1',
        reportsAvailable: 2,
        downloaded: 2,
        skipped: 0,
        latestStartTime: '2026-09-05T07:00:00Z',
        latestCreateTime: '2026-10-05T11:00:00Z',
      }),
    );
  });

  test('이미 받은 리포트는 다시 받지 않는다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingDownloadAction } = await import('./reporting-download');

    await reportingDownloadAction({} as never, { format: 'json', out: outDir });
    mockDownloadReport.mockClear();
    await reportingDownloadAction({} as never, { format: 'json', out: outDir });

    expect(mockDownloadReport).not.toHaveBeenCalled();
    expect(readManifest(outDir)).toHaveLength(3);
    const secondSummary = JSON.parse(consoleSpy.mock.calls[1][0] as string);
    expect(secondSummary.downloaded).toBe(0);
    expect(secondSummary.skipped).toBe(3);
  });

  test('파일은 있는데 manifest에 없는 리포트는 다시 받지 않고 manifest만 보완한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingDownloadAction } = await import('./reporting-download');
    const dir = path.join(outDir, 'channel_reach_basic_a1');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '20260904-101.csv'), 'date,video_id\n101,abc\n');

    await reportingDownloadAction({} as never, { format: 'json', out: outDir, jobIds: ['job-basic'] });

    expect(mockDownloadReport).toHaveBeenCalledTimes(1);
    const ids = readManifest(outDir).map((entry) => entry.reportId);
    expect(ids.sort()).toEqual(['101', '102']);
  });

  test('jobIds를 주면 해당 job만 받는다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportingDownloadAction } = await import('./reporting-download');

    await reportingDownloadAction({} as never, { format: 'json', out: outDir, jobIds: ['job-combined'] });

    expect(mockListReports).toHaveBeenCalledTimes(1);
    expect(mockListReports).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'job-combined' }));
    expect(fs.existsSync(path.join(outDir, 'channel_reach_basic_a1'))).toBe(false);
  });

  test('없는 job ID를 주면 에러를 던진다', async () => {
    const { reportingDownloadAction } = await import('./reporting-download');

    await expect(
      reportingDownloadAction({} as never, { format: 'json', out: outDir, jobIds: ['job-missing'] }),
    ).rejects.toThrow('job-missing');
  });

  test('아직 리포트가 없으면 빈 요약을 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    mockListReports.mockImplementation(() => Promise.resolve([]));
    const { reportingDownloadAction } = await import('./reporting-download');

    await reportingDownloadAction({} as never, { format: 'json', out: outDir });

    const summary = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(summary.downloaded).toBe(0);
    expect(summary.items[0]).toEqual(
      expect.objectContaining({ reportsAvailable: 0, latestStartTime: null, latestCreateTime: null }),
    );
    mockListReports.mockImplementation((params: { jobId: string }) =>
      Promise.resolve(reportsByJob[params.jobId] ?? []),
    );
  });
});
