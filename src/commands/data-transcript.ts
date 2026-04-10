import type { OAuth2Client } from 'google-auth-library';
import { fetchTranscript } from '../transcript.js';

interface ActionOptions {
  format: string;
  videoId: string;
  lang?: string;
}

export async function dataTranscriptAction(
  _auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await fetchTranscript(options.videoId, options.lang);

  if (options.format === 'text') {
    const text = result.segments.map((s) => s.text).join('\n');
    console.log(text);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}
