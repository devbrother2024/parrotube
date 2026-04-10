import type { OAuth2Client } from 'google-auth-library';
import { listSubscriptions } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  max: number;
}

export async function dataSubscriptionsAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await listSubscriptions({
    auth,
    maxResults: options.max,
  });
  output(result, options.format);
}
