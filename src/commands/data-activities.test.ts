import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListActivities = mock(() =>
  Promise.resolve({
    items: [
      {
        id: 'act-1',
        snippet: { title: 'Uploaded video', type: 'upload', publishedAt: '2026-01-15T10:00:00Z' },
        contentDetails: { upload: { videoId: 'vid-123' } },
      },
    ],
    pageInfo: { totalResults: 1 },
  }),
);

mock.module('../data-api', () => ({ listActivities: mockListActivities }));

describe('dataActivitiesAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListActivities.mockClear();
  });

  test('channelId 없이 호출 시 mine=true (channelId undefined)', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataActivitiesAction } = await import('./data-activities');

    await dataActivitiesAction({} as never, { format: 'json', max: 25 });

    expect(mockListActivities).toHaveBeenCalledWith(
      expect.objectContaining({ maxResults: 25 }),
    );
    const call = mockListActivities.mock.calls[0][0] as Record<string, unknown>;
    expect(call.channelId).toBeUndefined();
  });

  test('channelId 전달 시 해당 채널로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataActivitiesAction } = await import('./data-activities');

    await dataActivitiesAction({} as never, {
      format: 'json',
      channelId: 'UC123',
      max: 10,
    });

    expect(mockListActivities).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'UC123', maxResults: 10 }),
    );
  });

  test('max 옵션이 maxResults로 전달된다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataActivitiesAction } = await import('./data-activities');

    await dataActivitiesAction({} as never, { format: 'json', max: 50 });

    expect(mockListActivities).toHaveBeenCalledWith(
      expect.objectContaining({ maxResults: 50 }),
    );
  });

  test('결과를 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataActivitiesAction } = await import('./data-activities');

    await dataActivitiesAction({} as never, { format: 'json', max: 25 });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
