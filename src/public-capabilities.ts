export type PublicMetricStatus = 'available' | 'unavailable';

export interface PublicMetricCapability {
  metric: string;
  label: string;
  status: PublicMetricStatus;
  source: string;
  reason: string;
}

export interface PublicMetricCapabilities {
  availableMetrics: PublicMetricCapability[];
  unavailableMetrics: PublicMetricCapability[];
}

const AVAILABLE_METRICS: PublicMetricCapability[] = [
  {
    metric: 'channelMetadata',
    label: 'Channel metadata',
    status: 'available',
    source: 'YouTube Data API channels.list',
    reason: 'Public channel snippet and branding data can be queried by channel ID.',
  },
  {
    metric: 'channelStatistics',
    label: 'Channel public statistics',
    status: 'available',
    source: 'YouTube Data API channels.list',
    reason: 'Public view, subscriber, and video counts are exposed when available.',
  },
  {
    metric: 'videoMetadata',
    label: 'Video metadata',
    status: 'available',
    source: 'YouTube Data API videos.list',
    reason: 'Public video snippets and durations can be queried by video ID.',
  },
  {
    metric: 'videoStatistics',
    label: 'Video public statistics',
    status: 'available',
    source: 'YouTube Data API videos.list',
    reason: 'Public view, like, and comment counts are exposed when available.',
  },
  {
    metric: 'comments',
    label: 'Public comments',
    status: 'available',
    source: 'YouTube Data API commentThreads.list',
    reason: 'Public comment threads can be fetched for videos with comments enabled.',
  },
  {
    metric: 'transcripts',
    label: 'Public transcripts',
    status: 'available',
    source: 'yt-dlp subtitle metadata',
    reason: 'Public subtitles and auto-generated captions can be fetched when YouTube exposes tracks.',
  },
];

const OWNER_ONLY_METRICS: PublicMetricCapability[] = [
  {
    metric: 'ctr',
    label: 'Impressions click-through rate',
    status: 'unavailable',
    source: 'YouTube Analytics API',
    reason: 'CTR is an owner-only Analytics metric and is not exposed for arbitrary public channels.',
  },
  {
    metric: 'audienceRetention',
    label: 'Audience retention',
    status: 'unavailable',
    source: 'YouTube Analytics API',
    reason: 'Audience retention requires channel-owner Analytics access.',
  },
  {
    metric: 'averageViewDuration',
    label: 'Average view duration',
    status: 'unavailable',
    source: 'YouTube Analytics API',
    reason: 'Average view duration is an Analytics metric scoped to owned or authorized channels.',
  },
  {
    metric: 'trafficSources',
    label: 'Traffic sources',
    status: 'unavailable',
    source: 'YouTube Analytics API',
    reason: 'Traffic-source dimensions require Analytics access to the channel.',
  },
  {
    metric: 'demographics',
    label: 'Viewer demographics',
    status: 'unavailable',
    source: 'YouTube Analytics API',
    reason: 'Age and gender reports are private Analytics reports.',
  },
  {
    metric: 'revenue',
    label: 'Revenue and ad metrics',
    status: 'unavailable',
    source: 'YouTube Analytics API',
    reason: 'Revenue and ad performance metrics are private to the channel owner.',
  },
  {
    metric: 'searchTerms',
    label: 'YouTube Search terms',
    status: 'unavailable',
    source: 'YouTube Analytics API',
    reason: 'Search terms that drove views are owner-only traffic-source details.',
  },
];

function cloneMetric(metric: PublicMetricCapability): PublicMetricCapability {
  return { ...metric };
}

export function getPublicMetricCapabilities(): PublicMetricCapabilities {
  return {
    availableMetrics: AVAILABLE_METRICS.map(cloneMetric),
    unavailableMetrics: OWNER_ONLY_METRICS.map(cloneMetric),
  };
}
