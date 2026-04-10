import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListCaptions = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'cap-1',
        snippet: {
          videoId: 'vid-123',
          language: 'ko',
          name: '한국어 자막',
          trackKind: 'standard',
        },
      },
    ],
    pageInfo: { totalResults: 1 },
  }),
);

mock.module('../data-api', () => ({ listCaptions: mockListCaptions }));

describe('dataCaptionsAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListCaptions.mockClear();
  });

  test('videoId를 전달하여 호출한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCaptionsAction } = await import('./data-captions');

    await dataCaptionsAction({} as never, { format: 'json', videoId: 'vid-123' });

    expect(mockListCaptions).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: 'vid-123' }),
    );
  });

  test('결과를 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCaptionsAction } = await import('./data-captions');

    await dataCaptionsAction({} as never, { format: 'json', videoId: 'vid-123' });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
