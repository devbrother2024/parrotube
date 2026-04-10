import type { OAuth2Client } from 'google-auth-library';
import { listVideos } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  videoId: string;
}

export async function dataVideosAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const videoIds = options.videoId.split(',').map(id => id.trim());
  const result = await listVideos({ auth, videoIds });
  output(result, options.format);
}
