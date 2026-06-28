import type { OAuth2Client } from 'google-auth-library';
import { buildPublicChannelReport } from '../public-report.js';

interface ActionOptions {
  format: string;
  channelId: string;
  maxVideos: number;
  includeComments: boolean;
  maxCommentsPerVideo: number;
}

export async function publicReportAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await buildPublicChannelReport({
    auth,
    channelId: options.channelId,
    maxVideos: options.maxVideos,
    includeComments: options.includeComments,
    maxCommentsPerVideo: options.maxCommentsPerVideo,
  });

  console.log(JSON.stringify(result, null, 2));
}
