import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockListI18nRegions = mock(() =>
  Promise.resolve({
    items: [
      { id: 'KR', snippet: { gl: 'KR', name: '대한민국' } },
      { id: 'US', snippet: { gl: 'US', name: 'United States' } },
    ],
    pageInfo: { totalResults: 2 },
  }),
);

const mockListI18nLanguages = mock(() =>
  Promise.resolve({
    items: [
      { id: 'ko', snippet: { hl: 'ko', name: '한국어' } },
      { id: 'en', snippet: { hl: 'en', name: 'English' } },
    ],
    pageInfo: { totalResults: 2 },
  }),
);

mock.module('../data-api', () => ({
  listI18nRegions: mockListI18nRegions,
  listI18nLanguages: mockListI18nLanguages,
}));

describe('dataI18nAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockListI18nRegions.mockClear();
    mockListI18nLanguages.mockClear();
  });

  test('type=regions 시 listI18nRegions 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataI18nAction } = await import('./data-i18n');

    await dataI18nAction({} as never, { format: 'json', type: 'regions' });

    expect(mockListI18nRegions).toHaveBeenCalled();
    expect(mockListI18nLanguages).not.toHaveBeenCalled();
  });

  test('type=languages 시 listI18nLanguages 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataI18nAction } = await import('./data-i18n');

    await dataI18nAction({} as never, { format: 'json', type: 'languages' });

    expect(mockListI18nLanguages).toHaveBeenCalled();
    expect(mockListI18nRegions).not.toHaveBeenCalled();
  });

  test('결과를 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataI18nAction } = await import('./data-i18n');

    await dataI18nAction({} as never, { format: 'json', type: 'regions' });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
