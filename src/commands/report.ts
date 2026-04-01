import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
  max: number;
}

const QUERIES = {
  overview: {
    metrics: 'views,estimatedMinutesWatched,likes,subscribersGained,averageViewDuration',
  },
  demographics: {
    metrics: 'viewerPercentage',
    dimensions: 'ageGroup,gender',
  },
  geography: {
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'country',
    sort: '-estimatedMinutesWatched',
  },
  traffic: {
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'insightTrafficSourceType',
    sort: '-views',
  },
  devices: {
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'deviceType,operatingSystem',
    sort: '-views',
  },
  topVideos: {
    metrics: 'estimatedMinutesWatched,views,likes,subscribersGained',
    dimensions: 'video',
    sort: '-estimatedMinutesWatched',
  },
} as const;

export async function reportAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const base = {
    auth,
    startDate: options.startDate,
    endDate: options.endDate,
  };

  const [overview, demographics, geography, traffic, devices, topVideos] =
    await Promise.all([
      queryReport({ ...base, ...QUERIES.overview }),
      queryReport({ ...base, ...QUERIES.demographics }),
      queryReport({ ...base, ...QUERIES.geography }),
      queryReport({ ...base, ...QUERIES.traffic }),
      queryReport({ ...base, ...QUERIES.devices }),
      queryReport({ ...base, ...QUERIES.topVideos, maxResults: options.max }),
    ]);

  const report = { overview, demographics, geography, traffic, devices, topVideos };
  console.log(JSON.stringify(report, null, 2));
}
