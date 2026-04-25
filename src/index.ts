#!/usr/bin/env node

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import {
  authenticate,
  getAuthClient,
  loadToken,
  requireTokenScope,
  YOUTUBE_FORCE_SSL_SCOPE,
} from './auth.js';
import { resolveDates } from './utils/date.js';
import { overviewAction } from './commands/overview.js';
import { demographicsAction } from './commands/demographics.js';
import { geographyAction } from './commands/geography.js';
import { trafficAction } from './commands/traffic.js';
import { devicesAction } from './commands/devices.js';
import { topVideosAction } from './commands/top-videos.js';
import { reportAction } from './commands/report.js';
import { timeSeriesAction } from './commands/time-series.js';
import { revenueAction } from './commands/revenue.js';
import { searchTermsAction } from './commands/search-terms.js';
import { sharingAction } from './commands/sharing.js';
import { videoAction } from './commands/video.js';
import { queryAction } from './commands/query.js';
import { dataCommentsAction } from './commands/data-comments.js';
import { dataChannelAction } from './commands/data-channel.js';
import { dataVideosAction } from './commands/data-videos.js';
import { dataPlaylistsAction } from './commands/data-playlists.js';
import { dataPlaylistItemsAction } from './commands/data-playlist-items.js';
import { dataSearchAction } from './commands/data-search.js';
import { dataSubscriptionsAction } from './commands/data-subscriptions.js';
import { dataActivitiesAction } from './commands/data-activities.js';
import { dataCaptionsAction } from './commands/data-captions.js';
import { dataCaptionsUploadAction } from './commands/data-captions-upload.js';
import { dataTranscriptAction } from './commands/data-transcript.js';
import { dataCategoriesAction } from './commands/data-categories.js';
import { dataI18nAction } from './commands/data-i18n.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('parrotube')
    .description('YouTube Analytics CLI for AI agents and humans\n\nCommands marked [no auth] work without authentication.')
    .version('0.4.0')
    .option('-p, --period <value>', 'Shorthand period: 7d, 28d, 90d, 1y', '28d')
    .option('--start-date <YYYY-MM-DD>', 'Custom start date')
    .option('--end-date <YYYY-MM-DD>', 'Custom end date')
    .option('-f, --format <type>', 'Output format: json or table', 'json');

  program
    .command('auth')
    .description('Authenticate with YouTube (opens browser)')
    .action(async () => {
      await authenticate();
    });

  const analyticsCommands = [
    { name: 'overview', desc: 'Channel summary stats', action: overviewAction },
    { name: 'demographics', desc: 'Age group and gender breakdown', action: demographicsAction },
    { name: 'geography', desc: 'Country-level viewing data', action: geographyAction },
    { name: 'traffic', desc: 'Traffic source breakdown', action: trafficAction },
    { name: 'devices', desc: 'Device type and OS breakdown', action: devicesAction },
    { name: 'revenue', desc: 'Revenue and ad performance metrics', action: revenueAction },
    { name: 'sharing', desc: 'Sharing service breakdown', action: sharingAction },
  ];

  for (const cmd of analyticsCommands) {
    program
      .command(cmd.name)
      .description(cmd.desc)
      .action(async () => {
        const opts = program.opts();
        const dates = resolveDates(opts);
        const auth = await getAuthClient();
        await cmd.action(auth, { ...dates, format: opts.format });
      });
  }

  program
    .command('top-videos')
    .description('Top N videos by watch time')
    .option('-m, --max <number>', 'Max number of videos', '10')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const dates = resolveDates(opts);
      const auth = await getAuthClient();
      await topVideosAction(auth, {
        ...dates,
        format: opts.format,
        max: parseInt(cmdOpts.max, 10),
      });
    });

  program
    .command('report')
    .description('Full report -- runs all commands and outputs combined JSON')
    .option('-m, --max <number>', 'Max number of top videos', '10')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const dates = resolveDates(opts);
      const auth = await getAuthClient();
      await reportAction(auth, {
        ...dates,
        format: opts.format,
        max: parseInt(cmdOpts.max, 10),
      });
    });

  program
    .command('time-series')
    .description('Daily or monthly time-series data')
    .option('--by <unit>', 'Group by: day or month', 'day')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const dates = resolveDates(opts);
      const auth = await getAuthClient();
      await timeSeriesAction(auth, {
        ...dates,
        format: opts.format,
        by: cmdOpts.by,
      });
    });

  program
    .command('search-terms')
    .description('Top search terms driving traffic')
    .option('-m, --max <number>', 'Max number of search terms', '25')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const dates = resolveDates(opts);
      const auth = await getAuthClient();
      await searchTermsAction(auth, {
        ...dates,
        format: opts.format,
        max: parseInt(cmdOpts.max, 10),
      });
    });

  program
    .command('video')
    .description('Stats for a specific video')
    .requiredOption('--video-id <id>', 'YouTube video ID')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const dates = resolveDates(opts);
      const auth = await getAuthClient();
      await videoAction(auth, {
        ...dates,
        format: opts.format,
        videoId: cmdOpts.videoId,
      });
    });

  program
    .command('query')
    .description('Raw API query with custom metrics/dimensions')
    .requiredOption('--metrics <metrics>', 'Comma-separated metrics')
    .option('--dimensions <dims>', 'Comma-separated dimensions')
    .option('--sort <sort>', 'Sort field (prefix - for descending)')
    .option('--filters <filters>', 'Filter expression')
    .option('--max-results <number>', 'Max number of results')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const dates = resolveDates(opts);
      const auth = await getAuthClient();
      await queryAction(auth, {
        ...dates,
        format: opts.format,
        metrics: cmdOpts.metrics,
        dimensions: cmdOpts.dimensions,
        sort: cmdOpts.sort,
        filters: cmdOpts.filters,
        maxResults: cmdOpts.maxResults
          ? parseInt(cmdOpts.maxResults, 10)
          : undefined,
      });
    });

  // ---------- YouTube Data API v3 Commands ----------

  program
    .command('data:comments')
    .description('Fetch comment threads for a video')
    .requiredOption('--video-id <id>', 'YouTube video ID')
    .option('-m, --max <number>', 'Max comments to fetch', '100')
    .option('--all', 'Fetch all comments (paginated)')
    .option('--order <order>', 'Sort order: time or relevance', 'time')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataCommentsAction(auth, {
        format: opts.format,
        videoId: cmdOpts.videoId,
        max: parseInt(cmdOpts.max, 10),
        all: cmdOpts.all ?? false,
        order: cmdOpts.order,
      });
    });

  program
    .command('data:channel')
    .description('Channel info (snippet, statistics, branding)')
    .option('--channel-id <id>', 'Channel ID (default: authenticated user)')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataChannelAction(auth, {
        format: opts.format,
        channelId: cmdOpts.channelId,
      });
    });

  program
    .command('data:videos')
    .description('Video metadata (snippet, statistics, contentDetails)')
    .requiredOption('--video-id <ids>', 'Video ID(s), comma-separated')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataVideosAction(auth, {
        format: opts.format,
        videoId: cmdOpts.videoId,
      });
    });

  program
    .command('data:playlists')
    .description('List playlists')
    .option('--channel-id <id>', 'Channel ID (default: authenticated user)')
    .option('-m, --max <number>', 'Max playlists', '25')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataPlaylistsAction(auth, {
        format: opts.format,
        channelId: cmdOpts.channelId,
        max: parseInt(cmdOpts.max, 10),
      });
    });

  program
    .command('data:playlist-items')
    .description('List videos in a playlist')
    .requiredOption('--playlist-id <id>', 'Playlist ID')
    .option('-m, --max <number>', 'Max items', '50')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataPlaylistItemsAction(auth, {
        format: opts.format,
        playlistId: cmdOpts.playlistId,
        max: parseInt(cmdOpts.max, 10),
      });
    });

  program
    .command('data:search')
    .description('Search YouTube (videos, channels, playlists)')
    .requiredOption('-q, --query <text>', 'Search query')
    .option('--type <type>', 'Result type: video, channel, playlist', 'video')
    .option('-m, --max <number>', 'Max results', '25')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataSearchAction(auth, {
        format: opts.format,
        query: cmdOpts.query,
        type: cmdOpts.type,
        max: parseInt(cmdOpts.max, 10),
      });
    });

  program
    .command('data:subscriptions')
    .description('List subscriptions')
    .option('-m, --max <number>', 'Max subscriptions', '25')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataSubscriptionsAction(auth, {
        format: opts.format,
        max: parseInt(cmdOpts.max, 10),
      });
    });

  program
    .command('data:activities')
    .description('Channel activity feed')
    .option('--channel-id <id>', 'Channel ID (default: authenticated user)')
    .option('-m, --max <number>', 'Max activities', '25')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataActivitiesAction(auth, {
        format: opts.format,
        channelId: cmdOpts.channelId,
        max: parseInt(cmdOpts.max, 10),
      });
    });

  program
    .command('data:captions')
    .description('List captions for a video')
    .requiredOption('--video-id <id>', 'YouTube video ID')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataCaptionsAction(auth, {
        format: opts.format,
        videoId: cmdOpts.videoId,
      });
    });

  program
    .command('data:captions:upload')
    .description('Upload a caption track for a video')
    .requiredOption('--video-id <id>', 'YouTube video ID')
    .requiredOption('--file <path>', 'Caption file path')
    .requiredOption('--language <code>', 'Caption language code (e.g. ko, en)')
    .requiredOption('--name <name>', 'Caption track name')
    .option('--draft', 'Upload as a non-public draft')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      requireTokenScope(
        loadToken(),
        YOUTUBE_FORCE_SSL_SCOPE,
        'data:captions:upload',
      );
      const auth = await getAuthClient();
      await dataCaptionsUploadAction(auth, {
        format: opts.format,
        videoId: cmdOpts.videoId,
        file: cmdOpts.file,
        language: cmdOpts.language,
        name: cmdOpts.name,
        draft: cmdOpts.draft ?? false,
      });
    });

  program
    .command('data:transcript')
    .description('Extract transcript (subtitles/captions text) from a video [no auth]')
    .requiredOption('--video-id <id>', 'YouTube video ID')
    .option('--lang <code>', 'Language code (e.g. ko, en)')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      await dataTranscriptAction({
        format: opts.format,
        videoId: cmdOpts.videoId,
        lang: cmdOpts.lang,
      });
    });

  program
    .command('data:categories')
    .description('Video categories for a region')
    .option('--region-code <code>', 'Region code', 'KR')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataCategoriesAction(auth, {
        format: opts.format,
        regionCode: cmdOpts.regionCode,
      });
    });

  program
    .command('data:i18n')
    .description('i18n regions or languages')
    .option('--type <type>', 'Type: regions or languages', 'regions')
    .action(async (cmdOpts) => {
      const opts = program.opts();
      const auth = await getAuthClient();
      await dataI18nAction(auth, {
        format: opts.format,
        type: cmdOpts.type,
      });
    });

  return program;
}

async function main(): Promise<void> {
  try {
    const program = createProgram();
    await program.parseAsync(process.argv);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(JSON.stringify({ error: message }) + '\n');
    process.exit(1);
  }
}

function isEntrypoint(): boolean {
  const arg = process.argv[1];
  if (!arg) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return fs.realpathSync(arg) === fs.realpathSync(self);
  } catch {
    return false;
  }
}

if (isEntrypoint()) {
  main();
}
