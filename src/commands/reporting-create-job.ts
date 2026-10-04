import type { OAuth2Client } from 'google-auth-library';
import { createJob, listJobs } from '../reporting-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  reportType: string;
  name?: string;
}

export async function reportingCreateJobAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const existing = (await listJobs({ auth })).find(
    (job) => job.reportTypeId === options.reportType,
  );
  if (existing) {
    output({ created: false, items: [existing] }, options.format);
    return;
  }

  const job = await createJob({
    auth,
    reportTypeId: options.reportType,
    name: options.name ?? options.reportType,
  });
  output({ created: true, items: [job] }, options.format);
}
