import type { OAuth2Client } from 'google-auth-library';
import { listReportTypes } from '../reporting-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
}

export async function reportingTypesAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const items = await listReportTypes({ auth });
  output({ items }, options.format);
}
