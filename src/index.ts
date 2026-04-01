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

export function createProgram(): Command {
  const program = new Command();

  program
    .name('parrotube')
    .description('YouTube Analytics CLI for AI agents and humans')
    .version('0.1.0')
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
