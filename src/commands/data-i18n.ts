import type { OAuth2Client } from 'google-auth-library';
import { listI18nRegions, listI18nLanguages } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  type: 'regions' | 'languages';
}

export async function dataI18nAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result =
    options.type === 'regions'
      ? await listI18nRegions({ auth })
      : await listI18nLanguages({ auth });
  output(result, options.format);
}
