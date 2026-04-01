import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';
import { output } from '../utils/formatter.js';

const METRICS = 'estimatedMinutesWatched,views,likes,subscribersGained';
const DIMENSIONS = 'video';
const SORT = '-estimatedMinutesWatched';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
  max: number;
}

export async function topVideosAction(
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
    maxResults: options.max,
  });

  output(result, options.format);
}
