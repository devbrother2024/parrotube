import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';
import { output } from '../utils/formatter.js';

const METRICS = 'views,estimatedMinutesWatched';
const DIMENSIONS = 'deviceType,operatingSystem';
const SORT = '-views';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
}

export async function devicesAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await queryReport({
    auth,
    startDate: options.startDate,
    endDate: options.endDate,
    metrics: METRICS,
    dimensions: DIMENSIONS,
    sort: SORT,
  });

  output(result, options.format);
}
