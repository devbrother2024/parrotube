import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';
import { output } from '../utils/formatter.js';

const METRICS =
  'views,estimatedMinutesWatched,likes,comments,shares,subscribersGained,averageViewDuration';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
  videoId: string;
}

export async function videoAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await queryReport({
    auth,
    startDate: options.startDate,
    endDate: options.endDate,
    metrics: METRICS,
    filters: `video==${options.videoId}`,
  });

  output(result, options.format);
}
