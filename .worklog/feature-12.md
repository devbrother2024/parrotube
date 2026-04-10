## Data API 커맨드 확장 구현

### 핵심 변경 사항
- Data API 래퍼 추가: `src/data-api.ts`
  - commentThreads, channels, videos, playlists, playlistItems, search, subscriptions, activities, captions, videoCategories, i18n endpoints 래핑
- Data API 커맨드 추가
  - data-comments: 댓글 스레드 조회, `--all`, `--order`, `--max` 지원
  - data-channel: 채널 정보 조회, `--channel-id` 지원
  - data-videos: 영상 정보 조회, 복수 `videoId` 파싱 지원
  - data-playlists: 재생목록 조회, `--channel-id`, `--max` 지원
  - data-playlist-items: 재생목록 아이템 조회
  - data-search: 영상/채널/재생목록 검색
  - data-subscriptions: 구독 채널 조회
  - data-activities: 채널 활동 피드 조회
  - data-captions: 자막 목록 조회
  - data-categories: 지역별 영상 카테고리 조회
  - data-i18n: regions/languages 조회
- CLI 엔트리포인트 확장
  - `src/index.ts`에 `data:*` 커맨드 11종 등록
- 출력 포맷 확장
  - `src/utils/formatter.ts`에서 Data API `items[]` 응답을 table 포맷으로 렌더링
- 문서/규칙 정리
  - README에 Data API 커맨드 사용법 추가
  - AGENTS.md를 현재 구현 범위와 브랜치 운영 방식에 맞게 보정

### 테스트 결과
- `bun test`: 112 pass / 0 fail
- `src/data-api.test.ts`: Data API 래퍼 전 endpoint 테스트 통과
- `src/commands/data-*.test.ts`: 신규 Data API 커맨드 테스트 통과
- `src/index.test.ts`: CLI 커맨드 25개 등록 검증 통과
- `src/utils/formatter.test.ts`: Data API table 출력 검증 통과

### 설계 결정
- 기존 커맨드 패턴 유지: `mock.module('../data-api', ...)` + `output()`
- Data API 커맨드는 Analytics API와 분리하여 `startDate/endDate` 없이 `format`만 사용
- formatter는 Analytics 응답과 Data API 응답을 런타임에서 판별해 table 출력
- 커맨드 문서와 테스트 설명은 실제 등록 커맨드 수와 동기화

## TODO
- [ ] npm 배포 전 README 예시 명령 최종 점검
- [ ] 필요 시 Data API pagination 확장 여부 검토
