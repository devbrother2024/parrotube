import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockGetChannel = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'UC_test_channel',
        snippet: {
          title: '개발동생',
          description: '개발 교육 채널',
          publishedAt: '2020-01-01T00:00:00Z',
        },
        statistics: {
          viewCount: '100000',
          subscriberCount: '5000',
          videoCount: '200',
        },
      },
    ],
    pageInfo: { totalResults: 1 },
  }),
);

mock.module('../data-api', () => ({
  getChannel: mockGetChannel,
}));

describe('dataChannelAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockGetChannel.mockClear();
  });

  test('channelId 없이 호출 시 getChannel에 channelId 미전달', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataChannelAction } = await import('./data-channel');
    const fakeAuth = {} as never;

    await dataChannelAction(fakeAuth, { format: 'json' });

    expect(mockGetChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: fakeAuth,
      }),
    );
    const callArgs = mockGetChannel.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.channelId).toBeUndefined();
  });

  test('channelId 지정 시 getChannel에 channelId 전달', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataChannelAction } = await import('./data-channel');
    const fakeAuth = {} as never;

    await dataChannelAction(fakeAuth, { format: 'json', channelId: 'UC_test_channel' });

    expect(mockGetChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: fakeAuth,
        channelId: 'UC_test_channel',
      }),
    );
  });

  test('JSON 출력 확인', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataChannelAction } = await import('./data-channel');
    const fakeAuth = {} as never;

    await dataChannelAction(fakeAuth, { format: 'json' });

    expect(consoleSpy).toHaveBeenCalled();
    const printed = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(printed);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].id).toBe('UC_test_channel');
  });
});
