import { describe, expect, test, mock, afterEach } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const mockCommentThreadsList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          id: 'thread-1',
          snippet: {
            topLevelComment: {
              snippet: {
                authorDisplayName: '홍길동',
                authorProfileImageUrl: 'https://example.com/photo.jpg',
                textDisplay: '좋은 강의입니다!',
                likeCount: 5,
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
                  authorDisplayName: '답글러',
                  textDisplay: '동의합니다',
                  likeCount: 1,
                  publishedAt: '2026-01-16T10:00:00Z',
                },
              },
            ],
          },
        },
      ],
      nextPageToken: undefined,
      pageInfo: { totalResults: 1 },
    },
  }),
);

const mockChannelsList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          id: 'channel-1',
          snippet: { title: '개발동생', description: 'AI 교육' },
          statistics: { viewCount: '100000', subscriberCount: '5000' },
        },
      ],
    },
  }),
);

const mockVideosList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          id: 'video-1',
          snippet: { title: '테스트 영상', description: '설명' },
          statistics: { viewCount: '10000', likeCount: '500' },
          contentDetails: { duration: 'PT10M30S' },
        },
      ],
    },
  }),
);

const mockPlaylistsList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          id: 'playlist-1',
          snippet: { title: '강의 모음', description: 'AI 강의' },
          contentDetails: { itemCount: 10 },
        },
      ],
    },
  }),
);

const mockPlaylistItemsList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          snippet: {
            title: '1강',
            resourceId: { videoId: 'video-1' },
            position: 0,
          },
        },
      ],
    },
  }),
);

const mockSearchList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          id: { videoId: 'search-video-1' },
          snippet: { title: '검색 결과', description: '설명' },
        },
      ],
      pageInfo: { totalResults: 1 },
    },
  }),
);

const mockSubscriptionsList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          snippet: {
            title: '구독 채널',
            resourceId: { channelId: 'sub-channel-1' },
          },
        },
      ],
    },
  }),
);

const mockActivitiesList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          snippet: { type: 'upload', title: '새 영상 업로드' },
          contentDetails: { upload: { videoId: 'upload-1' } },
        },
      ],
    },
  }),
);

const mockCaptionsList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          id: 'caption-1',
          snippet: { language: 'ko', name: '한국어 자막', trackKind: 'standard' },
        },
      ],
    },
  }),
);

const mockCaptionsInsert = mock(() =>
  Promise.resolve({
    data: {
      id: 'caption-uploaded',
      snippet: {
        videoId: 'video-1',
        language: 'ko',
        name: 'Korean captions',
        isDraft: false,
      },
    },
  }),
);

const mockVideoCategoriesList = mock(() =>
  Promise.resolve({
    data: {
      items: [
        {
          id: '27',
          snippet: { title: 'Education', assignable: true },
        },
      ],
    },
  }),
);

const mockI18nRegionsList = mock(() =>
  Promise.resolve({
    data: {
      items: [{ id: 'KR', snippet: { gl: 'KR', name: 'South Korea' } }],
    },
  }),
);

const mockI18nLanguagesList = mock(() =>
  Promise.resolve({
    data: {
      items: [{ id: 'ko', snippet: { hl: 'ko', name: 'Korean' } }],
    },
  }),
);

mock.module('googleapis', () => ({
  google: {
    youtube: () => ({
      commentThreads: { list: mockCommentThreadsList },
      channels: { list: mockChannelsList },
      videos: { list: mockVideosList },
      playlists: { list: mockPlaylistsList },
      playlistItems: { list: mockPlaylistItemsList },
      search: { list: mockSearchList },
      subscriptions: { list: mockSubscriptionsList },
      activities: { list: mockActivitiesList },
      captions: { list: mockCaptionsList, insert: mockCaptionsInsert },
      videoCategories: { list: mockVideoCategoriesList },
      i18nRegions: { list: mockI18nRegionsList },
      i18nLanguages: { list: mockI18nLanguagesList },
    }),
  },
}));

describe('data-api', () => {
  afterEach(() => {
    mockCommentThreadsList.mockClear();
    mockChannelsList.mockClear();
    mockVideosList.mockClear();
    mockPlaylistsList.mockClear();
    mockPlaylistItemsList.mockClear();
    mockSearchList.mockClear();
    mockSubscriptionsList.mockClear();
    mockActivitiesList.mockClear();
    mockCaptionsList.mockClear();
    mockCaptionsInsert.mockClear();
    mockVideoCategoriesList.mockClear();
    mockI18nRegionsList.mockClear();
    mockI18nLanguagesList.mockClear();
  });

  test('listCommentThreads - videoId와 올바른 part로 호출', async () => {
    const { listCommentThreads } = await import('./data-api');
    const fakeAuth = {} as never;

    await listCommentThreads({
      auth: fakeAuth,
      videoId: 'test-video',
      maxResults: 50,
    });

    expect(mockCommentThreadsList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet', 'replies'],
        videoId: 'test-video',
        maxResults: 50,
      }),
    );
  });

  test('listCommentThreads - order 옵션 전달', async () => {
    const { listCommentThreads } = await import('./data-api');
    const fakeAuth = {} as never;

    await listCommentThreads({
      auth: fakeAuth,
      videoId: 'test-video',
      order: 'relevance',
    });

    expect(mockCommentThreadsList).toHaveBeenCalledWith(
      expect.objectContaining({
        order: 'relevance',
      }),
    );
  });

  test('listCommentThreads - 응답 데이터 반환', async () => {
    const { listCommentThreads } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listCommentThreads({
      auth: fakeAuth,
      videoId: 'test-video',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('thread-1');
  });

  test('listAllCommentThreads - 페이지네이션 처리', async () => {
    let callCount = 0;
    mockCommentThreadsList.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          data: {
            items: [{ id: 'thread-1', snippet: { topLevelComment: { snippet: {} }, totalReplyCount: 0 } }],
            nextPageToken: 'page2',
            pageInfo: { totalResults: 2 },
          },
        });
      }
      return Promise.resolve({
        data: {
          items: [{ id: 'thread-2', snippet: { topLevelComment: { snippet: {} }, totalReplyCount: 0 } }],
          nextPageToken: undefined,
          pageInfo: { totalResults: 2 },
        },
      });
    });

    const stderrSpy = mock(() => true);
    const originalWrite = process.stderr.write;
    process.stderr.write = stderrSpy as unknown as typeof process.stderr.write;

    const { listAllCommentThreads } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listAllCommentThreads({
      auth: fakeAuth,
      videoId: 'test-video',
    });

    process.stderr.write = originalWrite;

    expect(result.items).toHaveLength(2);
    expect(mockCommentThreadsList).toHaveBeenCalledTimes(2);
  });

  test('getChannel - mine=true 기본 호출', async () => {
    const { getChannel } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await getChannel({ auth: fakeAuth });

    expect(mockChannelsList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet', 'statistics', 'contentDetails', 'brandingSettings'],
        mine: true,
      }),
    );
    expect(result.items[0].snippet.title).toBe('개발동생');
  });

  test('getChannel - channelId로 호출', async () => {
    const { getChannel } = await import('./data-api');
    const fakeAuth = {} as never;

    await getChannel({ auth: fakeAuth, channelId: 'channel-123' });

    expect(mockChannelsList).toHaveBeenCalledWith(
      expect.objectContaining({
        id: ['channel-123'],
      }),
    );
  });

  test('listVideos - videoId 배열로 호출', async () => {
    const { listVideos } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listVideos({
      auth: fakeAuth,
      videoIds: ['video-1', 'video-2'],
    });

    expect(mockVideosList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet', 'statistics', 'contentDetails', 'status'],
        id: ['video-1', 'video-2'],
      }),
    );
    expect(result.items[0].snippet.title).toBe('테스트 영상');
  });

  test('listPlaylists - mine=true 기본 호출', async () => {
    const { listPlaylists } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listPlaylists({ auth: fakeAuth });

    expect(mockPlaylistsList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet', 'contentDetails'],
        mine: true,
      }),
    );
    expect(result.items[0].snippet.title).toBe('강의 모음');
  });

  test('listPlaylistItems - playlistId로 호출', async () => {
    const { listPlaylistItems } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listPlaylistItems({
      auth: fakeAuth,
      playlistId: 'playlist-1',
      maxResults: 25,
    });

    expect(mockPlaylistItemsList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet', 'contentDetails'],
        playlistId: 'playlist-1',
        maxResults: 25,
      }),
    );
    expect(result.items[0].snippet.title).toBe('1강');
  });

  test('searchVideos - query와 type으로 호출', async () => {
    const { searchVideos } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await searchVideos({
      auth: fakeAuth,
      query: 'AI 교육',
      type: 'video',
      maxResults: 10,
    });

    expect(mockSearchList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet'],
        q: 'AI 교육',
        type: ['video'],
        maxResults: 10,
      }),
    );
    expect(result.items[0].snippet.title).toBe('검색 결과');
  });

  test('listSubscriptions - mine=true 기본 호출', async () => {
    const { listSubscriptions } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listSubscriptions({ auth: fakeAuth });

    expect(mockSubscriptionsList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet'],
        mine: true,
      }),
    );
    expect(result.items[0].snippet.title).toBe('구독 채널');
  });

  test('listActivities - mine=true 기본 호출', async () => {
    const { listActivities } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listActivities({ auth: fakeAuth });

    expect(mockActivitiesList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet', 'contentDetails'],
        mine: true,
      }),
    );
    expect(result.items[0].snippet.type).toBe('upload');
  });

  test('listCaptions - videoId로 호출', async () => {
    const { listCaptions } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listCaptions({ auth: fakeAuth, videoId: 'video-1' });

    expect(mockCaptionsList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet'],
        videoId: 'video-1',
      }),
    );
    expect(result.items[0].snippet.language).toBe('ko');
  });

  test('uploadCaption - 자막 파일과 metadata를 captions.insert로 전달', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parrotube-caption-'));
    const captionPath = path.join(tmpDir, 'captions.vtt');
    fs.writeFileSync(captionPath, 'WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHello\n');

    const { uploadCaption } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await uploadCaption({
      auth: fakeAuth,
      videoId: 'video-1',
      filePath: captionPath,
      language: 'ko',
      name: 'Korean captions',
      isDraft: false,
    });

    expect(mockCaptionsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet'],
        requestBody: {
          snippet: {
            videoId: 'video-1',
            language: 'ko',
            name: 'Korean captions',
            isDraft: false,
          },
        },
        media: expect.objectContaining({
          mimeType: 'application/octet-stream',
        }),
      }),
    );
    const request = mockCaptionsInsert.mock.calls[0]?.[0] as {
      media?: { body?: unknown };
    };
    expect(request.media?.body).toBeTruthy();
    expect(result.id).toBe('caption-uploaded');
  });

  test('uploadCaption - 100MB 초과 파일은 업로드 전 거부', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parrotube-caption-'));
    const captionPath = path.join(tmpDir, 'large.vtt');
    fs.writeFileSync(captionPath, '');
    fs.truncateSync(captionPath, 100 * 1024 * 1024 + 1);

    const { uploadCaption } = await import('./data-api');

    await expect(
      uploadCaption({
        auth: {} as never,
        videoId: 'video-1',
        filePath: captionPath,
        language: 'ko',
        name: 'Large captions',
        isDraft: false,
      }),
    ).rejects.toThrow('Caption file must be 100MB or smaller');
    expect(mockCaptionsInsert).not.toHaveBeenCalled();
  });

  test('listVideoCategories - regionCode로 호출', async () => {
    const { listVideoCategories } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listVideoCategories({ auth: fakeAuth, regionCode: 'KR' });

    expect(mockVideoCategoriesList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet'],
        regionCode: 'KR',
      }),
    );
    expect(result.items[0].snippet.title).toBe('Education');
  });

  test('listI18nRegions - 호출 및 반환', async () => {
    const { listI18nRegions } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listI18nRegions({ auth: fakeAuth });

    expect(mockI18nRegionsList).toHaveBeenCalledWith(
      expect.objectContaining({ part: ['snippet'] }),
    );
    expect(result.items[0].id).toBe('KR');
  });

  test('listI18nLanguages - 호출 및 반환', async () => {
    const { listI18nLanguages } = await import('./data-api');
    const fakeAuth = {} as never;

    const result = await listI18nLanguages({ auth: fakeAuth });

    expect(mockI18nLanguagesList).toHaveBeenCalledWith(
      expect.objectContaining({ part: ['snippet'] }),
    );
    expect(result.items[0].id).toBe('ko');
  });
});
