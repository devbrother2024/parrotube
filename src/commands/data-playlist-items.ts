import type { OAuth2Client } from 'google-auth-library';
import { listPlaylistItems } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  playlistId: string;
  max: number;
}

export async function dataPlaylistItemsAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await listPlaylistItems({
    auth,
    playlistId: options.playlistId,
    maxResults: options.max,
  });
  output(result, options.format);
}
