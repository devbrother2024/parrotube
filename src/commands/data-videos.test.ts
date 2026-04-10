import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListVideos = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'video-1',
        snippet: { title: '첫 번째 영상', publishedAt: '2026-01-01T00:00:00Z' },
        statistics: { viewCount: '1000', likeCount: '50' },
      },
      {
        id: 'video-2',
        snippet: { title: '두 번째 영상', publishedAt: '2026-02-01T00:00:00Z' },
        statistics: { viewCount: '2000', likeCount: '100' },
      },
    ],
    pageInfo: { totalResults: 2 },
  }),
);

mock.module('../data-api', () => ({
  listVideos: mockListVideos,
}));

describe('dataVideosAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListVideos.mockClear();
  });

  test('단일 videoId로 listVideos 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataVideosAction } = await import('./data-videos');
    const fakeAuth = {} as never;

    await dataVideosAction(fakeAuth, { format: 'json', videoId: 'video-1' });

    expect(mockListVideos).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: fakeAuth,
        videoIds: ['video-1'],
      }),
    );
  });

  test('쉼표 구분 videoId를 배열로 파싱', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataVideosAction } = await import('./data-videos');
    const fakeAuth = {} as never;

    await dataVideosAction(fakeAuth, { format: 'json', videoId: 'video-1, video-2' });

    expect(mockListVideos).toHaveBeenCalledWith(
      expect.objectContaining({
        videoIds: ['video-1', 'video-2'],
      }),
    );
  });

  test('공백 포함 쉼표 구분도 trim 처리', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataVideosAction } = await import('./data-videos');
    const fakeAuth = {} as never;

    await dataVideosAction(fakeAuth, { format: 'json', videoId: '  video-1 ,  video-2  ' });

    expect(mockListVideos).toHaveBeenCalledWith(
      expect.objectContaining({
        videoIds: ['video-1', 'video-2'],
      }),
    );
  });

  test('JSON 출력 확인', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataVideosAction } = await import('./data-videos');
    const fakeAuth = {} as never;

    await dataVideosAction(fakeAuth, { format: 'json', videoId: 'video-1' });

    expect(consoleSpy).toHaveBeenCalled();
    const printed = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(printed);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0].id).toBe('video-1');
  });
});
