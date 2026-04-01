import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';
import { output } from '../utils/formatter.js';

const METRICS = 'views,estimatedMinutesWatched';
const DIMENSIONS = 'insightTrafficSourceDetail';
const FILTERS = 'insightTrafficSourceType==YT_SEARCH';
const SORT = '-views';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
  max: number;
}

export async function searchTermsAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await queryReport({
    auth,
    startDate: options.startDate,
    endDate: options.endDate,
    metrics: METRICS,
    dimensions: DIMENSIONS,
    filters: FILTERS,
    sort: SORT,
    maxResults: options.max,
  });

  output(result, options.format);
}
