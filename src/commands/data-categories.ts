import type { OAuth2Client } from 'google-auth-library';
import { listVideoCategories } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  regionCode: string;
}

export async function dataCategoriesAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await listVideoCategories({
    auth,
    regionCode: options.regionCode,
  });
  output(result, options.format);
}
