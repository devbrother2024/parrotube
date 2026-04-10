import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockSearchVideos = mock(() =>
  Promise.resolve({
    items: [
      {
        id: { videoId: 'result-1' },
        snippet: {
          title: 'TypeScript 강의',
          description: 'TS 기초 강의입니다',
          channelTitle: '개발동생',
          publishedAt: '2026-01-10T10:00:00Z',
        },
      },
    ],
    pageInfo: { totalResults: 1 },
  }),
);

mock.module('../data-api', () => ({
  searchVideos: mockSearchVideos,
}));

describe('dataSearchAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockSearchVideos.mockClear();
  });

  test('query, type, max를 전달하여 searchVideos 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataSearchAction } = await import('./data-search');
    const fakeAuth = {} as never;

    await dataSearchAction(fakeAuth, {
      format: 'json',
      query: 'TypeScript',
      type: 'video',
      max: 10,
    });

    expect(mockSearchVideos).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'TypeScript',
        type: 'video',
        maxResults: 10,
      }),
    );
  });

  test('type 옵션이 전달됨', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataSearchAction } = await import('./data-search');
    const fakeAuth = {} as never;

    await dataSearchAction(fakeAuth, {
      format: 'json',
      query: 'React',
      type: 'channel',
      max: 5,
    });

    expect(mockSearchVideos).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'channel',
      }),
    );
  });

  test('결과를 JSON으로 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataSearchAction } = await import('./data-search');
    const fakeAuth = {} as never;

    await dataSearchAction(fakeAuth, {
      format: 'json',
      query: 'TypeScript',
      type: 'video',
      max: 25,
    });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
