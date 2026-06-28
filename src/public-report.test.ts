import { afterEach, describe, expect, mock, test } from 'bun:test';

const mockGetChannel = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'channel-1',
        snippet: {
          title: 'Public Channel',
          description: 'Public description',
          customUrl: '@public',
          publishedAt: '2024-01-01T00:00:00Z',
        },
        statistics: {
          viewCount: '1000',
          subscriberCount: '100',
          videoCount: '2',
        },
        contentDetails: {
          relatedPlaylists: {
            uploads: 'uploads-1',
          },
        },
      },
    ],
  }),
);

const mockListPlaylistItems = mock(() =>
  Promise.resolve({
    items: [
      {
        contentDetails: { videoId: 'video-1' },
        snippet: { title: 'Upload 1' },
      },
      {
        snippet: { resourceId: { videoId: 'video-2' }, title: 'Upload 2' },
      },
    ],
  }),
);

const mockListVideos = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'video-1',
        snippet: {
          title: 'Video 1',
          description: 'First',
          publishedAt: '2026-01-01T00:00:00Z',
          channelId: 'channel-1',
        },
        statistics: { viewCount: '500', likeCount: '20', commentCount: '4' },
        contentDetails: { duration: 'PT10M' },
      },
      {
        id: 'video-2',
        snippet: {
          title: 'Video 2',
          description: 'Second',
          publishedAt: '2026-01-02T00:00:00Z',
          channelId: 'channel-1',
        },
        statistics: { viewCount: '300', likeCount: '10', commentCount: '2' },
        contentDetails: { duration: 'PT5M' },
      },
    ],
  }),
);

const mockListCommentThreads = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'thread-1',
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: 'Viewer',
              textDisplay: 'Good video',
              likeCount: 3,
              publishedAt: '2026-01-03T00:00:00Z',
            },
          },
          totalReplyCount: 1,
        },
      },
    ],
  }),
);

describe('buildPublicChannelReport', () => {
  afterEach(() => {
    mockGetChannel.mockClear();
    mockListPlaylistItems.mockClear();
    mockListVideos.mockClear();
    mockListCommentThreads.mockClear();
  });

  test('builds a public report from channel, uploads playlist, and video stats', async () => {
    const { buildPublicChannelReport } = await import('./public-report');

    const report = await buildPublicChannelReport({
      auth: {} as never,
      channelId: 'channel-1',
      maxVideos: 2,
      includeComments: false,
      dependencies: {
        getChannel: mockGetChannel,
        listPlaylistItems: mockListPlaylistItems,
        listVideos: mockListVideos,
        listCommentThreads: mockListCommentThreads,
      },
    });

    expect(mockGetChannel).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'channel-1' }),
    );
    expect(mockListPlaylistItems).toHaveBeenCalledWith(
      expect.objectContaining({ playlistId: 'uploads-1', maxResults: 2 }),
    );
    expect(mockListVideos).toHaveBeenCalledWith(
      expect.objectContaining({ videoIds: ['video-1', 'video-2'] }),
    );
    expect(report.kind).toBe('public-channel-report');
    expect(report.channel.title).toBe('Public Channel');
    expect(report.channel.statistics.viewCount).toBe(1000);
    expect(report.videos.items).toHaveLength(2);
    expect(report.availableMetrics.map((metric) => metric.metric)).toContain('videoStatistics');
    expect(report.unavailableMetrics.map((metric) => metric.metric)).toContain('ctr');
    expect(report.commentsSummary.included).toBe(false);
  });

  test('comments are opt-in', async () => {
    const { buildPublicChannelReport } = await import('./public-report');

    const report = await buildPublicChannelReport({
      auth: {} as never,
      channelId: 'channel-1',
      maxVideos: 1,
      includeComments: true,
      maxCommentsPerVideo: 5,
      dependencies: {
        getChannel: mockGetChannel,
        listPlaylistItems: mockListPlaylistItems,
        listVideos: mockListVideos,
        listCommentThreads: mockListCommentThreads,
      },
    });

    expect(mockListCommentThreads).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'video-1',
        maxResults: 5,
        order: 'relevance',
      }),
    );
    expect(report.commentsSummary.included).toBe(true);
    expect(report.commentsSummary.totalFetched).toBe(1);
  });

  test('throws when the channel cannot be found', async () => {
    mockGetChannel.mockResolvedValueOnce({ items: [] });
    const { buildPublicChannelReport } = await import('./public-report');

    await expect(
      buildPublicChannelReport({
        auth: {} as never,
        channelId: 'missing',
        maxVideos: 10,
        includeComments: false,
        dependencies: {
          getChannel: mockGetChannel,
          listPlaylistItems: mockListPlaylistItems,
          listVideos: mockListVideos,
          listCommentThreads: mockListCommentThreads,
        },
      }),
    ).rejects.toThrow('Public channel not found: missing');
  });
});
