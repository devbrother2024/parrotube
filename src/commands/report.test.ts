import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

let callCount = 0;
const MOCK_RESPONSES = [
  { columnHeaders: [{ name: 'views', columnType: 'METRIC' }], rows: [[50000]] },
  { columnHeaders: [{ name: 'ageGroup', columnType: 'DIMENSION' }], rows: [['age25-34', 35]] },
  { columnHeaders: [{ name: 'country', columnType: 'DIMENSION' }], rows: [['KR', 30000]] },
  { columnHeaders: [{ name: 'insightTrafficSourceType', columnType: 'DIMENSION' }], rows: [['YT_SEARCH', 20000]] },
  { columnHeaders: [{ name: 'deviceType', columnType: 'DIMENSION' }], rows: [['MOBILE', 25000]] },
  { columnHeaders: [{ name: 'video', columnType: 'DIMENSION' }], rows: [['abc123', 8000]] },
];

const mockQueryReport = mock(() => {
  const response = MOCK_RESPONSES[callCount % MOCK_RESPONSES.length];
  callCount++;
  return Promise.resolve(response);
});

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('reportAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
    callCount = 0;
  });

  test('6개 서브커맨드에 대해 queryReport를 6번 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportAction } = await import('./report');

    await reportAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      max: 10,
    });

    expect(mockQueryReport).toHaveBeenCalledTimes(6);
  });

  test('통합 JSON에 6개 키가 포함', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { reportAction } = await import('./report');

    await reportAction({} as never, {
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      format: 'json',
      max: 10,
    });

    const printed = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(printed);
    expect(parsed).toHaveProperty('overview');
    expect(parsed).toHaveProperty('demographics');
    expect(parsed).toHaveProperty('geography');
    expect(parsed).toHaveProperty('traffic');
    expect(parsed).toHaveProperty('devices');
    expect(parsed).toHaveProperty('topVideos');
  });
});
