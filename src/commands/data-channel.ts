import type { OAuth2Client } from 'google-auth-library';
import { getChannel } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  channelId?: string;
}

export async function dataChannelAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await getChannel({
    auth,
    channelId: options.channelId,
  });
  output(result, options.format);
}
