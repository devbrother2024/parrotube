#!/usr/bin/env node

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { authenticate, getAuthClient } from './auth.js';
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

export function createProgram(): Command {
  const program = new Command();

  program
    .name('parrotube')
    .description('YouTube Analytics CLI for AI agents and humans')
    .version('0.2.0')
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
