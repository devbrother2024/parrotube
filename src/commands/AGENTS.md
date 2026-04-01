# commands -- YouTube Analytics 서브커맨드

## Module Context

YouTube Analytics API의 각 분석 영역을 독립된 서브커맨드로 제공한다.
모든 커맨드는 `queryReport()` (src/api.ts)를 통해 API를 호출하고, `output()` (src/utils/formatter.ts)으로 결과를 출력한다.

의존성 흐름: `commands/*.ts` -> `api.ts` -> `googleapis` / `commands/*.ts` -> `utils/formatter.ts`

## Subcommand Spec

각 서브커맨드의 API 파라미터 매핑:

### overview
- metrics: `views,estimatedMinutesWatched,likes,subscribersGained,averageViewDuration`
- dimensions: 없음 (채널 전체 요약, 단일 row)

### demographics
- metrics: `viewerPercentage`
- dimensions: `ageGroup,gender`

### geography
- metrics: `views,estimatedMinutesWatched`
- dimensions: `country`
- sort: `-estimatedMinutesWatched`

### traffic
- metrics: `views,estimatedMinutesWatched`
- dimensions: `insightTrafficSourceType`
- sort: `-views`

### devices
- metrics: `views,estimatedMinutesWatched`
- dimensions: `deviceType,operatingSystem`
- sort: `-views`

### top-videos
- metrics: `estimatedMinutesWatched,views,likes,subscribersGained`
- dimensions: `video`
- sort: `-estimatedMinutesWatched`
- maxResults: `--max` CLI 옵션 (기본값 10)

### report
- 위 6개 커맨드를 순차 실행
- 출력: `{ overview, demographics, geography, traffic, devices, topVideos }` 통합 JSON

## Implementation Pattern

모든 커맨드 파일은 동일한 구조를 따른다:

```typescript
import type { OAuth2Client } from 'google-auth-library';
import { queryReport } from '../api.js';
import { output } from '../utils/formatter.js';

const METRICS = '...';
const DIMENSIONS = '...';
const SORT = '...';

interface ActionOptions {
  startDate: string;
  endDate: string;
  format: string;
}

export async function xxxAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = await queryReport({
    auth,
    startDate: options.startDate,
    endDate: options.endDate,
    metrics: METRICS,
    dimensions: DIMENSIONS,
    sort: SORT,
  });
  output(result, options.format);
}
```

## Testing Pattern

```typescript
import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockQueryReport = mock(() =>
  Promise.resolve({
    columnHeaders: [/* 해당 커맨드의 헤더 */],
    rows: [/* 샘플 데이터 */],
  }),
);

mock.module('../api', () => ({ queryReport: mockQueryReport }));

describe('xxxAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockQueryReport.mockClear();
  });

  test('올바른 metrics/dimensions로 호출', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { xxxAction } = await import('./xxx');
    await xxxAction({} as never, { startDate: '...', endDate: '...', format: 'json' });
    expect(mockQueryReport).toHaveBeenCalledWith(expect.objectContaining({ metrics: '...' }));
  });

  test('결과를 출력', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { xxxAction } = await import('./xxx');
    await xxxAction({} as never, { startDate: '...', endDate: '...', format: 'json' });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
```

## Naming Convention
- 파일명: kebab-case.ts (예: top-videos.ts)
- export 함수명: camelCase + `Action` 접미사 (예: `topVideosAction`)
- 테스트 파일명: kebab-case.test.ts (예: top-videos.test.ts)

## Local Golden Rules

### Do's
- 새 커맨드 추가 시 위 Subcommand Spec에 매핑 정보를 먼저 기록한다
- `ActionOptions` 인터페이스를 커맨드 간 일관되게 유지한다
- `report.ts`에 새 커맨드 추가 시 통합 JSON 키도 함께 추가한다

### Don'ts
- 커맨드 파일에서 `getAuthClient()`를 직접 호출하지 않는다 (auth는 상위에서 주입)
- `queryReport` 외의 방법으로 API를 직접 호출하지 않는다
- 커맨드 파일에서 `process.exit()`를 호출하지 않는다 (에러는 throw로 전파)
