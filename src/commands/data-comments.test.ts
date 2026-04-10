import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListCommentThreads = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'thread-1',
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: '수강생A',
              authorProfileImageUrl: 'https://example.com/a.jpg',
              textDisplay: '정말 유익한 강의였습니다!',
              likeCount: 10,
              publishedAt: '2026-01-15T10:00:00Z',
              updatedAt: '2026-01-15T10:00:00Z',
            },
          },
          totalReplyCount: 1,
        },
        replies: {
          comments: [
            {
              snippet: {
                authorDisplayName: '개발동생',
                authorProfileImageUrl: 'https://example.com/dev.jpg',
                textDisplay: '감사합니다!',
                likeCount: 2,
                publishedAt: '2026-01-16T10:00:00Z',
              },
            },
          ],
        },
      },
    ],
    nextPageToken: undefined,
    pageInfo: { totalResults: 1 },
  }),
);

const mockListAllCommentThreads = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'thread-1',
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: '수강생A',
              authorProfileImageUrl: 'https://example.com/a.jpg',
              textDisplay: '유익한 강의!',
              likeCount: 10,
              publishedAt: '2026-01-15T10:00:00Z',
              updatedAt: '2026-01-15T10:00:00Z',
            },
          },
          totalReplyCount: 0,
        },
      },
      {
        id: 'thread-2',
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: '수강생B',
              authorProfileImageUrl: 'https://example.com/b.jpg',
              textDisplay: '최고입니다',
              likeCount: 5,
              publishedAt: '2026-01-14T10:00:00Z',
              updatedAt: '2026-01-14T10:00:00Z',
            },
          },
          totalReplyCount: 0,
        },
      },
    ],
    pageInfo: { totalResults: 2 },
  }),
);

mock.module('../data-api', () => ({
  listCommentThreads: mockListCommentThreads,
  listAllCommentThreads: mockListAllCommentThreads,
}));

describe('dataCommentsAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListCommentThreads.mockClear();
    mockListAllCommentThreads.mockClear();
  });

  test('videoId로 listCommentThreads 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCommentsAction } = await import('./data-comments');
    const fakeAuth = {} as never;

    await dataCommentsAction(fakeAuth, {
      format: 'json',
      videoId: 'test-video',
      max: 100,
      all: false,
      order: 'time',
    });

    expect(mockListCommentThreads).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'test-video',
        maxResults: 100,
        order: 'time',
      }),
    );
  });

  test('--all 플래그 시 listAllCommentThreads 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCommentsAction } = await import('./data-comments');
    const fakeAuth = {} as never;

    await dataCommentsAction(fakeAuth, {
      format: 'json',
      videoId: 'test-video',
      max: 100,
      all: true,
      order: 'time',
    });

    expect(mockListAllCommentThreads).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'test-video',
        order: 'time',
      }),
    );
    expect(mockListCommentThreads).not.toHaveBeenCalled();
  });

  test('JSON 출력 구조: videoId, totalResults, comments 배열', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCommentsAction } = await import('./data-comments');
    const fakeAuth = {} as never;

    await dataCommentsAction(fakeAuth, {
      format: 'json',
      videoId: 'test-video',
      max: 100,
      all: false,
      order: 'time',
    });

    const printed = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(printed);

    expect(parsed.videoId).toBe('test-video');
    expect(parsed.totalResults).toBe(1);
    expect(parsed.comments).toHaveLength(1);
    expect(parsed.comments[0].author).toBe('수강생A');
    expect(parsed.comments[0].text).toBe('정말 유익한 강의였습니다!');
    expect(parsed.comments[0].likeCount).toBe(10);
    expect(parsed.comments[0].publishedAt).toBe('2026-01-15T10:00:00Z');
    expect(parsed.comments[0].replyCount).toBe(1);
  });

  test('replies가 포함된 댓글 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCommentsAction } = await import('./data-comments');
    const fakeAuth = {} as never;

    await dataCommentsAction(fakeAuth, {
      format: 'json',
      videoId: 'test-video',
      max: 100,
      all: false,
      order: 'time',
    });

    const printed = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(printed);

    expect(parsed.comments[0].replies).toHaveLength(1);
    expect(parsed.comments[0].replies[0].author).toBe('개발동생');
    expect(parsed.comments[0].replies[0].text).toBe('감사합니다!');
  });

  test('order 옵션 전달', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCommentsAction } = await import('./data-comments');
    const fakeAuth = {} as never;

    await dataCommentsAction(fakeAuth, {
      format: 'json',
      videoId: 'test-video',
      max: 50,
      all: false,
      order: 'relevance',
    });

    expect(mockListCommentThreads).toHaveBeenCalledWith(
      expect.objectContaining({
        order: 'relevance',
      }),
    );
  });
});
