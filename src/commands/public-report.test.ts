import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';

const mockBuildPublicChannelReport = mock(() =>
  Promise.resolve({
    kind: 'public-channel-report',
    channelId: 'channel-1',
    availableMetrics: [],
    unavailableMetrics: [],
  }),
);

mock.module('../public-report', () => ({
  buildPublicChannelReport: mockBuildPublicChannelReport,
}));

describe('publicReportAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockBuildPublicChannelReport.mockClear();
  });

  test('passes CLI options to buildPublicChannelReport and outputs JSON', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { publicReportAction } = await import('./public-report');

    await publicReportAction({} as never, {
      format: 'json',
      channelId: 'channel-1',
      maxVideos: 3,
      includeComments: true,
      maxCommentsPerVideo: 10,
    });

    expect(mockBuildPublicChannelReport).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: 'channel-1',
        maxVideos: 3,
        includeComments: true,
        maxCommentsPerVideo: 10,
      }),
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('composite report stays JSON even when table format is requested', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { publicReportAction } = await import('./public-report');

    await publicReportAction({} as never, {
      format: 'table',
      channelId: 'channel-1',
      maxVideos: 1,
      includeComments: false,
      maxCommentsPerVideo: 0,
    });

    const printed = consoleSpy.mock.calls[0]?.[0];
    expect(typeof printed).toBe('string');
    expect(JSON.parse(String(printed)).kind).toBe('public-channel-report');
  });
});
