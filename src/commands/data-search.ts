import type { OAuth2Client } from 'google-auth-library';
import { searchVideos } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  query: string;
  type: string;
  max: number;
}

export async function dataSearchAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await searchVideos({
    auth,
    query: options.query,
    type: options.type,
    maxResults: options.max,
  });
  output(result, options.format);
}
