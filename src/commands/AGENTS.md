# commands -- CLI command families

## Module Context

parrotube CLI는 세 가지 command family를 제공한다.

- Analytics commands: 소유/권한 채널의 YouTube Analytics API 지표 조회.
- Data API commands: YouTube Data API v3 원시 리소스 조회.
- Public analysis commands: 임의 공개 채널을 공개 메타데이터/영상 통계/댓글/트랜스크립트로 분석하고, 불가능한 owner-only 지표를 명시.

의존성 흐름:

- `commands/*.ts` -> `api.ts` -> `googleapis` (Analytics)
- `commands/data-*.ts` -> `data-api.ts` -> `googleapis` (Data API)
- `commands/public-*.ts` -> `public-report.ts` -> `data-api.ts` / `transcript.ts`
- `commands/*.ts` -> `utils/formatter.ts`

## Analytics Subcommand Spec

각 Analytics 서브커맨드의 API 파라미터 매핑:

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

### time-series
- metrics: `views,estimatedMinutesWatched,likes,subscribersGained,averageViewDuration`
- dimensions: `day` (기본) 또는 `month`
- sort: dimension과 동일 (오름차순)
- CLI 옵션: `--by day|month` (기본값 day)

### revenue
- metrics: `estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue,grossRevenue,cpm,adImpressions,monetizedPlaybacks`
- dimensions: 없음 (채널 전체 수익 요약)

### search-terms
- metrics: `views,estimatedMinutesWatched`
- dimensions: `insightTrafficSourceDetail`
- filters: `insightTrafficSourceType==YT_SEARCH`
- sort: `-views`
- maxResults: `--max` CLI 옵션 (기본값 25)

### sharing
- metrics: `shares`
- dimensions: `sharingService`
- sort: `-shares`

### video
- metrics: `views,estimatedMinutesWatched,likes,comments,shares,subscribersGained,averageViewDuration`
- dimensions: 없음
- filters: `video==VIDEO_ID`
- CLI 옵션: `--video-id` (필수)

### query
- metrics: `--metrics` CLI 옵션 (필수, 사용자 지정)
- dimensions: `--dimensions` CLI 옵션 (선택)
- sort: `--sort` CLI 옵션 (선택)
- filters: `--filters` CLI 옵션 (선택)
- maxResults: `--max-results` CLI 옵션 (선택)

### report
- 위 6개 기본 커맨드를 병렬 실행
- 출력: `{ overview, demographics, geography, traffic, devices, topVideos }` 통합 JSON

## Public Analysis Subcommand Spec

### public:report

- 입력: `--channel-id` 필수
- 옵션: `--max-videos`, `--include-comments`, `--max-comments-per-video`, `--include-transcripts`, `--lang`
- 데이터 흐름:
  1. `getChannel({ channelId })`로 공개 채널 메타데이터와 uploads playlist ID 조회
  2. `listPlaylistItems({ playlistId })`로 최근 업로드 video ID 수집
  3. `listVideos({ videoIds })`로 공개 영상 메타데이터와 공개 통계 조회
  4. `--include-comments`가 있으면 `listCommentThreads()`로 댓글 요약 수집
  5. `--include-transcripts`가 있으면 `fetchTranscript()`로 공개 자막 요약 수집
- 출력:
  - `availableMetrics`: 공개 데이터로 가능한 지표
  - `unavailableMetrics`: CTR, 시청 지속률, 유입경로, 인구통계, 수익, 검색어 유입 등 owner-only Analytics 지표
  - `channel`, `videos`, `commentsSummary`, `transcriptsSummary`, `warnings`

Public analysis는 비공개 Analytics 지표를 추정하지 않는다. API상 불가능한 지표는 실패가 아니라 `unavailableMetrics` 계약으로 표현한다.

## Implementation Pattern

Analytics 커맨드 파일은 동일한 구조를 따른다:

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
- 새 커맨드 추가 시 README.md의 Commands 섹션, Authentication Requirements 테이블, --help description을 함께 업데이트한다
- `ActionOptions` 인터페이스를 커맨드 간 일관되게 유지한다
- `report.ts`에 새 커맨드 추가 시 통합 JSON 키도 함께 추가한다
- public 명령은 `availableMetrics`와 `unavailableMetrics` 계약을 유지한다

### Don'ts
- 커맨드 파일에서 `getAuthClient()`를 직접 호출하지 않는다 (auth는 상위에서 주입)
- Analytics 커맨드에서 `queryReport` 외의 방법으로 API를 직접 호출하지 않는다
- public 명령에서 CTR, 시청 지속률, 유입경로, 수익 등 owner-only 지표를 계산/추정하지 않는다
- 커맨드 파일에서 `process.exit()`를 호출하지 않는다 (에러는 throw로 전파)
