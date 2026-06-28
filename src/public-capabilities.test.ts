import { describe, expect, test } from 'bun:test';

describe('public capabilities', () => {
  test('owner-only Analytics metrics are reported as unavailable', async () => {
    const { getPublicMetricCapabilities } = await import('./public-capabilities');

    const capabilities = getPublicMetricCapabilities();
    const unavailable = capabilities.unavailableMetrics.map((metric) => metric.metric);

    expect(unavailable).toContain('ctr');
    expect(unavailable).toContain('audienceRetention');
    expect(unavailable).toContain('trafficSources');
    expect(unavailable).toContain('demographics');
    expect(unavailable).toContain('revenue');
    expect(unavailable).toContain('searchTerms');
    expect(unavailable).toContain('transcripts');
    expect(
      capabilities.unavailableMetrics.every(
        (metric) => metric.status === 'unavailable' && metric.reason.length > 0,
      ),
    ).toBe(true);
  });

  test('public metadata and engagement metrics are reported as available', async () => {
    const { getPublicMetricCapabilities } = await import('./public-capabilities');

    const capabilities = getPublicMetricCapabilities();
    const available = capabilities.availableMetrics.map((metric) => metric.metric);

    expect(available).toContain('channelMetadata');
    expect(available).toContain('channelStatistics');
    expect(available).toContain('videoMetadata');
    expect(available).toContain('videoStatistics');
    expect(available).toContain('comments');
    expect(available).not.toContain('transcripts');
  });
});
