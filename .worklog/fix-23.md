## YouTube 자막 가져오기를 yt-dlp 기반으로 교체

### 핵심 변경 사항

- `src/transcript.ts`에서 Innertube WEB 클라이언트 직접 호출 방식을 yt-dlp subprocess + json3 fetch 방식으로 전면 교체
- YouTube가 Innertube API에 PO Token을 요구하기 시작하면서 기존 방식이 완전히 고장남 (WEB → UNPLAYABLE, ANDROID → FAILED_PRECONDITION, timedtext → 빈 응답)
- 외부 인터페이스(`TranscriptResult`, `CaptionTrack`, `TranscriptSegment`, `selectTrack`, `fetchTranscript`, `listAvailableTracks`)는 그대로 유지
- 삭제: `extractCaptionTracks`, `parseTimedTextXml` (더 이상 사용 안 함)
- 추가: `parseJson3Subtitles` (yt-dlp json3 포맷 파싱)
- 테스트 전면 재작성: mock 대상을 `globalThis.fetch` → `node:child_process` + `fetch`로 변경
- README에 yt-dlp 의존성 안내 추가

### 테스트 결과

- `bun test`: 132개 전체 통과 (transcript 16개 포함)
- `bun run build`: tsc 컴파일 성공
- E2E: `data:transcript --video-id dQw4w9WgXcQ` 영어/일본어 수동 자막 정상 출력
- 한국어 자동 자막은 YouTube 429 레이트 리밋 (일시적, 코드 문제 아님)

### 설계 결정

- **yt-dlp `--dump-json` 1회 호출로 트랙 목록 + json3 URL 모두 추출** → 임시 파일 불필요, 메모리 내 처리
- `node:child_process`의 `execFile` 콜백을 직접 Promise 래퍼로 감싸 사용 → `promisify`가 Bun mock에서 호환 문제 있어서
- `CaptionTrack.baseUrl`에 json3 URL 저장 (디버깅용)
- 수동 자막 우선, 자동 자막 나중에 배치 (기존 동작과 동일한 우선순위)

## TODO
### 배포
- [ ] 버전 올리고 npm publish
### 개선
- [ ] json3 포맷이 없을 때 vtt/srv3 폴백 지원
- [ ] table 포맷 출력 시 중첩 구조(segments) 플래트닝
