import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';
import { output } from '../utils/formatter.js';

const METRICS = 'viewerPercentage';
const DIMENSIONS = 'ageGroup,gender';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
}

export async function demographicsAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await queryReport({
    auth,
    startDate: options.startDate,
    endDate: options.endDate,
    metrics: METRICS,
    dimensions: DIMENSIONS,
  });

  output(result, options.format);
}
