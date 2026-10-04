import type { OAuth2Client } from 'google-auth-library';
import { listJobs } from '../reporting-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
}

export async function reportingJobsAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const items = await listJobs({ auth });
  output({ items }, options.format);
}
