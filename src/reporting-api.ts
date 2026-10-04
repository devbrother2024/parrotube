import { google, type youtubereporting_v1 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export type ReportType = youtubereporting_v1.Schema$ReportType;
export type ReportingJob = youtubereporting_v1.Schema$Job;
export type ReportingReport = youtubereporting_v1.Schema$Report;

interface Page<T> {
  items: T[];
  nextPageToken?: string | null;
}

function getReportingClient(auth: OAuth2Client) {
  return google.youtubereporting({ version: 'v1', auth });
}

async function collectPages<T>(
  fetchPage: (pageToken?: string) => Promise<Page<T>>,
): Promise<T[]> {
  const all: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await fetchPage(pageToken);
    all.push(...page.items);
    pageToken = page.nextPageToken ?? undefined;
  } while (pageToken);
  return all;
}

export async function listReportTypes(params: { auth: OAuth2Client }): Promise<ReportType[]> {
  const client = getReportingClient(params.auth);
  return collectPages(async (pageToken) => {
    const { data } = await client.reportTypes.list({ pageToken });
    return { items: data.reportTypes ?? [], nextPageToken: data.nextPageToken };
  });
}

export async function listJobs(params: { auth: OAuth2Client }): Promise<ReportingJob[]> {
  const client = getReportingClient(params.auth);
  return collectPages(async (pageToken) => {
    const { data } = await client.jobs.list({ pageToken });
    return { items: data.jobs ?? [], nextPageToken: data.nextPageToken };
  });
}

export interface CreateJobParams {
  auth: OAuth2Client;
  reportTypeId: string;
  name: string;
}

export async function createJob(params: CreateJobParams): Promise<ReportingJob> {
  const client = getReportingClient(params.auth);
  const { data } = await client.jobs.create({
    requestBody: { reportTypeId: params.reportTypeId, name: params.name },
  });
  return data;
}

export interface ListReportsParams {
  auth: OAuth2Client;
  jobId: string;
}

export async function listReports(params: ListReportsParams): Promise<ReportingReport[]> {
  const client = getReportingClient(params.auth);
  return collectPages(async (pageToken) => {
    const { data } = await client.jobs.reports.list({ jobId: params.jobId, pageToken });
    return { items: data.reports ?? [], nextPageToken: data.nextPageToken };
  });
}

export interface DownloadReportParams {
  auth: OAuth2Client;
  downloadUrl: string;
}

export async function downloadReport(params: DownloadReportParams): Promise<string> {
  const response = await params.auth.request<string>({
    url: params.downloadUrl,
    responseType: 'text',
  });
  return response.data;
}
