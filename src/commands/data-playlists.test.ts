import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListPlaylists = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'PL_test_1',
        snippet: { title: 'TypeScript 기초', publishedAt: '2026-01-01T00:00:00Z' },
        contentDetails: { itemCount: 10 },
      },
      {
        id: 'PL_test_2',
        snippet: { title: 'React 심화', publishedAt: '2026-02-01T00:00:00Z' },
        contentDetails: { itemCount: 5 },
      },
    ],
    pageInfo: { totalResults: 2 },
  }),
);

mock.module('../data-api', () => ({
  listPlaylists: mockListPlaylists,
}));

describe('dataPlaylistsAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListPlaylists.mockClear();
  });

  test('channelId 없이 호출 시 channelId 미전달', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataPlaylistsAction } = await import('./data-playlists');
    const fakeAuth = {} as never;

    await dataPlaylistsAction(fakeAuth, { format: 'json', max: 25 });

    expect(mockListPlaylists).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: fakeAuth,
        maxResults: 25,
      }),
    );
    const callArgs = mockListPlaylists.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.channelId).toBeUndefined();
  });

  test('channelId 지정 시 listPlaylists에 channelId 전달', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataPlaylistsAction } = await import('./data-playlists');
    const fakeAuth = {} as never;

    await dataPlaylistsAction(fakeAuth, { format: 'json', channelId: 'UC_test', max: 10 });

    expect(mockListPlaylists).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: fakeAuth,
        channelId: 'UC_test',
        maxResults: 10,
      }),
    );
  });

  test('max 옵션이 maxResults로 전달', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataPlaylistsAction } = await import('./data-playlists');
    const fakeAuth = {} as never;

    await dataPlaylistsAction(fakeAuth, { format: 'json', max: 50 });

    expect(mockListPlaylists).toHaveBeenCalledWith(
      expect.objectContaining({
        maxResults: 50,
      }),
    );
  });

  test('JSON 출력 확인', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataPlaylistsAction } = await import('./data-playlists');
    const fakeAuth = {} as never;

    await dataPlaylistsAction(fakeAuth, { format: 'json', max: 25 });

    expect(consoleSpy).toHaveBeenCalled();
    const printed = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(printed);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0].id).toBe('PL_test_1');
  });
});
