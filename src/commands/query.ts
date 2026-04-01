import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
  metrics: string;
  dimensions?: string;
  sort?: string;
  filters?: string;
  maxResults?: number;
}

export async function queryAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await queryReport({
    auth,
    startDate: options.startDate,
    endDate: options.endDate,
    metrics: options.metrics,
    dimensions: options.dimensions,
    sort: options.sort,
    filters: options.filters,
    maxResults: options.maxResults,
  });

  output(result, options.format);
}
