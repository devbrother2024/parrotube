import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';
import { output } from '../utils/formatter.js';

const METRICS =
  'views,estimatedMinutesWatched,likes,subscribersGained,averageViewDuration';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
}

export async function overviewAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await queryReport({
    auth,
    startDate: options.startDate,
    endDate: options.endDate,
    metrics: METRICS,
  });

  output(result, options.format);
}
