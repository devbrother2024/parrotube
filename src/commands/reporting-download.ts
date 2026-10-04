import fs from 'node:fs';
import path from 'node:path';
import type { OAuth2Client } from 'google-auth-library';
import { downloadReport, listJobs, listReports } from '../reporting-api.js';
import type { ReportingJob, ReportingReport } from '../reporting-api.js';
import { output } from '../utils/formatter.js';

const MANIFEST_FILE = 'manifest.jsonl';

interface ActionOptions {
  format: string;
  out: string;
  jobIds?: string[];
}

interface ManifestEntry {
  reportId: string;
  jobId: string;
  reportTypeId: string;
  startTime: string;
  endTime: string | null;
  createTime: string | null;
  file: string;
  bytes: number;
  downloadedAt: string;
}

interface JobSummary {
  jobId: string;
  reportTypeId: string;
  reportsAvailable: number;
  downloaded: number;
  skipped: number;
  latestStartTime: string | null;
  latestCreateTime: string | null;
  newFiles: string[];
}

function reportFileName(reportId: string, startTime: string): string {
  const day = startTime.slice(0, 10).replaceAll('-', '');
  return `${day}-${reportId.replace(/[^\w.-]/g, '_')}.csv`;
}

function loadManifestIds(manifestPath: string): Set<string> {
  if (!fs.existsSync(manifestPath)) return new Set();
  const ids = fs
    .readFileSync(manifestPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => (JSON.parse(line) as ManifestEntry).reportId);
  return new Set(ids);
}

function latest(values: (string | null | undefined)[]): string | null {
  const present = values.filter((v): v is string => Boolean(v));
  return present.length ? present.reduce((a, b) => (a > b ? a : b)) : null;
}

function selectJobs(jobs: ReportingJob[], jobIds?: string[]): ReportingJob[] {
  if (!jobIds?.length) return jobs;
  const missing = jobIds.filter((id) => !jobs.some((job) => job.id === id));
  if (missing.length) {
    throw new Error(`Unknown Reporting API job ID: ${missing.join(', ')}`);
  }
  return jobs.filter((job) => job.id && jobIds.includes(job.id));
}

export async function reportingDownloadAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const outDir = path.resolve(options.out);
  const manifestPath = path.join(outDir, MANIFEST_FILE);
  const jobs = selectJobs(await listJobs({ auth }), options.jobIds);

  fs.mkdirSync(outDir, { recursive: true });
  const knownIds = loadManifestIds(manifestPath);
  const items: JobSummary[] = [];

  for (const job of jobs) {
    if (!job.id || !job.reportTypeId) continue;
    const reports = await listReports({ auth, jobId: job.id });
    const summary: JobSummary = {
      jobId: job.id,
      reportTypeId: job.reportTypeId,
      reportsAvailable: reports.length,
      downloaded: 0,
      skipped: 0,
      latestStartTime: latest(reports.map((r) => r.startTime)),
      latestCreateTime: latest(reports.map((r) => r.createTime)),
      newFiles: [],
    };

    for (const report of reports) {
      await saveReport({ auth, report, outDir, manifestPath, knownIds, summary });
    }
    items.push(summary);
  }

  output(
    {
      outDir,
      downloaded: items.reduce((sum, item) => sum + item.downloaded, 0),
      skipped: items.reduce((sum, item) => sum + item.skipped, 0),
      items,
    },
    options.format,
  );
}

interface SaveReportParams {
  auth: OAuth2Client;
  report: ReportingReport;
  outDir: string;
  manifestPath: string;
  knownIds: Set<string>;
  summary: JobSummary;
}

async function saveReport(params: SaveReportParams): Promise<void> {
  const { auth, report, outDir, manifestPath, knownIds, summary } = params;
  if (!report.id || !report.startTime || !report.downloadUrl) {
    throw new Error(`Report metadata is incomplete for job ${summary.jobId}`);
  }

  const relativeFile = path.posix.join(summary.reportTypeId, reportFileName(report.id, report.startTime));
  const file = path.join(outDir, relativeFile);
  const exists = fs.existsSync(file);

  if (!exists) {
    const csv = await downloadReport({ auth, downloadUrl: report.downloadUrl });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.part`, csv);
    fs.renameSync(`${file}.part`, file);
    summary.downloaded += 1;
    summary.newFiles.push(relativeFile);
  } else {
    summary.skipped += 1;
  }

  if (knownIds.has(report.id)) return;
  const entry: ManifestEntry = {
    reportId: report.id,
    jobId: summary.jobId,
    reportTypeId: summary.reportTypeId,
    startTime: report.startTime,
    endTime: report.endTime ?? null,
    createTime: report.createTime ?? null,
    file: relativeFile,
    bytes: fs.statSync(file).size,
    downloadedAt: new Date().toISOString(),
  };
  fs.appendFileSync(manifestPath, `${JSON.stringify(entry)}\n`);
  knownIds.add(report.id);
}
