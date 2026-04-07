import type { OAuth2Client } from 'google-auth-library';
import { listPlaylists } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  channelId?: string;
  max: number;
}

export async function dataPlaylistsAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await listPlaylists({
    auth,
    channelId: options.channelId,
    maxResults: options.max,
  });
  output(result, options.format);
}
