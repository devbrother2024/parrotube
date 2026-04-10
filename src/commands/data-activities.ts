import type { OAuth2Client } from 'google-auth-library';
import { listActivities } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  channelId?: string;
  max: number;
}

export async function dataActivitiesAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await listActivities({
    auth,
    channelId: options.channelId,
    maxResults: options.max,
  });
  output(result, options.format);
}
