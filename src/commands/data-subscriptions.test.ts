import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListSubscriptions = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'sub-1',
        snippet: {
          title: '개발채널A',
          channelId: 'UC-channel-a',
          description: '개발 관련 채널',
          publishedAt: '2025-06-01T10:00:00Z',
        },
      },
    ],
    pageInfo: { totalResults: 1 },
  }),
);

mock.module('../data-api', () => ({
  listSubscriptions: mockListSubscriptions,
}));

describe('dataSubscriptionsAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListSubscriptions.mockClear();
  });

  test('max 옵션이 maxResults로 전달됨', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataSubscriptionsAction } = await import('./data-subscriptions');
    const fakeAuth = {} as never;

    await dataSubscriptionsAction(fakeAuth, {
      format: 'json',
      max: 15,
    });

    expect(mockListSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({
        maxResults: 15,
      }),
    );
  });

  test('auth가 전달됨', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataSubscriptionsAction } = await import('./data-subscriptions');
    const fakeAuth = { fake: true } as never;

    await dataSubscriptionsAction(fakeAuth, {
      format: 'json',
      max: 25,
    });

    expect(mockListSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: fakeAuth,
      }),
    );
  });

  test('결과를 JSON으로 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataSubscriptionsAction } = await import('./data-subscriptions');
    const fakeAuth = {} as never;

    await dataSubscriptionsAction(fakeAuth, {
      format: 'json',
      max: 25,
    });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
