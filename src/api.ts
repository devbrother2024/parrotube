import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export interface QueryParams {
  auth: OAuth2Client;
  startDate: string;
  endDate: string;
  metrics: string;
  dimensions?: string;
  sort?: string;
  filters?: string;
  maxResults?: number;
}

export interface AnalyticsResult {
  columnHeaders: { name: string; columnType: string }[];
  rows: unknown[][];
}

export async function queryReport(params: QueryParams): Promise<AnalyticsResult> {
  const yt = google.youtubeAnalytics({ version: 'v2', auth: params.auth });

  const response = await yt.reports.query({
    ids: 'channel==MINE',
    startDate: params.startDate,
    endDate: params.endDate,
    metrics: params.metrics,
    dimensions: params.dimensions,
    sort: params.sort,
    filters: params.filters,
    maxResults: params.maxResults,
  });

  return response.data as unknown as AnalyticsResult;
}
