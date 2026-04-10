import type { OAuth2Client } from 'google-auth-library';
import { listCaptions } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  videoId: string;
}

export async function dataCaptionsAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await listCaptions({ auth, videoId: options.videoId });
  output(result, options.format);
}
