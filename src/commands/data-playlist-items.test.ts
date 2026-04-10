import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListPlaylistItems = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'item-1',
        snippet: {
          title: '첫 번째 영상',
          position: 0,
          resourceId: { videoId: 'vid-1' },
        },
        contentDetails: { videoId: 'vid-1' },
      },
      {
        id: 'item-2',
        snippet: {
          title: '두 번째 영상',
          position: 1,
          resourceId: { videoId: 'vid-2' },
        },
        contentDetails: { videoId: 'vid-2' },
      },
    ],
    pageInfo: { totalResults: 2 },
  }),
);

mock.module('../data-api', () => ({
  listPlaylistItems: mockListPlaylistItems,
}));

describe('dataPlaylistItemsAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListPlaylistItems.mockClear();
  });

  test('playlistId를 전달하여 listPlaylistItems 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataPlaylistItemsAction } = await import('./data-playlist-items');
    const fakeAuth = {} as never;

    await dataPlaylistItemsAction(fakeAuth, {
      format: 'json',
      playlistId: 'PL-test-123',
      max: 50,
    });

    expect(mockListPlaylistItems).toHaveBeenCalledWith(
      expect.objectContaining({
        playlistId: 'PL-test-123',
        maxResults: 50,
      }),
    );
  });

  test('max 옵션이 maxResults로 전달됨', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataPlaylistItemsAction } = await import('./data-playlist-items');
    const fakeAuth = {} as never;

    await dataPlaylistItemsAction(fakeAuth, {
      format: 'json',
      playlistId: 'PL-test-456',
      max: 10,
    });

    expect(mockListPlaylistItems).toHaveBeenCalledWith(
      expect.objectContaining({
        maxResults: 10,
      }),
    );
  });

  test('결과를 JSON으로 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataPlaylistItemsAction } = await import('./data-playlist-items');
    const fakeAuth = {} as never;

    await dataPlaylistItemsAction(fakeAuth, {
      format: 'json',
      playlistId: 'PL-test-123',
      max: 50,
    });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
