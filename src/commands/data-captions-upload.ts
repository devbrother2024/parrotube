import type { OAuth2Client } from 'google-auth-library';
import { uploadCaption } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  videoId: string;
  file: string;
  language: string;
  name: string;
  draft: boolean;
}

export async function dataCaptionsUploadAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await uploadCaption({
    auth,
    videoId: options.videoId,
    filePath: options.file,
    language: options.language,
    name: options.name,
    isDraft: options.draft,
  });

  if (options.format === 'table') {
    output({ items: [result] }, options.format);
    return;
  }

  output(result, options.format);
}
