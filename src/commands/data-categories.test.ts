import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListVideoCategories = mock(() =>
  Promise.resolve({
    items: [
      {
        id: '1',
        snippet: { title: 'Film & Animation', assignable: true },
      },
      {
        id: '10',
        snippet: { title: 'Music', assignable: true },
      },
    ],
    pageInfo: { totalResults: 2 },
  }),
);

mock.module('../data-api', () => ({ listVideoCategories: mockListVideoCategories }));

describe('dataCategoriesAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListVideoCategories.mockClear();
  });

  test('regionCode를 전달하여 호출한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCategoriesAction } = await import('./data-categories');

    await dataCategoriesAction({} as never, { format: 'json', regionCode: 'US' });

    expect(mockListVideoCategories).toHaveBeenCalledWith(
      expect.objectContaining({ regionCode: 'US' }),
    );
  });

  test('결과를 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCategoriesAction } = await import('./data-categories');

    await dataCategoriesAction({} as never, { format: 'json', regionCode: 'KR' });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
