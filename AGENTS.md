# parrotube

## Project Context & Operations

### Overview
YouTube Analytics API와 YouTube Data API v3를 래핑하는 CLI 도구. AI 에이전트와 사람 모두가 채널 통계(인구통계, 지역, 트래픽, 기기, 인기영상, 시계열, 수익, 검색어, 공유, 개별영상)를 JSON/Table로 조회하고, 댓글/채널/영상/재생목록 등 Data API 리소스도 동일한 CLI에서 조회한다. 범용 query 커맨드로 임의 API 쿼리도 지원한다.

### Tech Stack
- Runtime: Bun (개발/테스트) / Node.js >= 18 (배포)
- Language: TypeScript 6.x (ESM, `"type": "module"`, strict mode)
- CLI: Commander.js 13.x
- API: Google YouTube Analytics API v2, YouTube Data API v3 (`googleapis` 144.x)
- Output: cli-table3 (table), JSON (default stdout)
- Test: Bun Test (built-in, `bun:test`)
- Build: `tsc` -> `dist/`

### Operational Commands
- **Dev**: `bun run dev` -- tsx로 src/index.ts 직접 실행
- **Build**: `bun run build` -- tsc 컴파일, dist/ 출력
- **Test**: `bun test` -- 전체 테스트 실행
- **Test Watch**: `bun test --watch` -- 파일 변경 감지 테스트
- **Test Single**: `bun test src/utils/date.test.ts` -- 단일 파일 테스트
- **Start**: `node dist/index.js` -- 빌드된 JS 실행

## Golden Rules

### Immutable
- OAuth2 credential(client_secret.json, token.json)을 코드에 하드코딩하지 않는다
- credential 경로는 `~/.config/parrotube/` 고정
- stdout은 구조화된 데이터(JSON/Table) 전용이다. 절대 디버그 메시지를 stdout에 출력하지 않는다
- 에러는 `{"error": "message"}` JSON으로 stderr에 출력한다 (에이전트 파싱 용이)
- 테스트 없이 기능을 구현하지 않는다 (TDD 필수)

### Do's
- 기능 추가/변경 시 `package.json`과 `src/index.ts`의 version을 함께 올린다 (semver: 기능 추가 = minor, 버그 수정 = patch)
- 커맨드를 추가/수정/삭제할 때 반드시 README.md의 Commands 섹션과 Authentication Requirements 테이블도 함께 업데이트한다
- 테스트를 먼저 작성하고 구현한다 (Red-Green-Refactor)
- 모든 export 함수에 대해 테스트를 작성한다
- 테스트 파일은 소스 옆에 `*.test.ts` 패턴으로 배치한다
- API 호출은 `mock.module()`로 mock하여 테스트한다
- 타입을 명시적으로 선언한다 (no implicit any)
- ESM `import`/`export`만 사용한다
- 사람용 안내 메시지는 `process.stderr.write()`로 출력한다

### Don'ts
- `any` 타입 금지 (불가피 시 주석으로 사유 명시)
- `console.log`로 에러/안내를 출력하지 않는다
- `require()` 금지
- `node_modules/`, `dist/`, `*.tsbuildinfo` 을 커밋하지 않는다

## Standards & References

### Coding Conventions
- 변수/함수: camelCase
- 타입/인터페이스: PascalCase
- 파일명: kebab-case.ts
- 테스트 파일명: kebab-case.test.ts
- 한 파일 하나의 책임

### Git Strategy
- Branch: `feat/*`, `fix/*`, `refactor/*` 패턴
- Commit: 한국어, 접두사 필수 (feat:, fix:, test:, refactor:, docs:, chore:)
- 작업 브랜치는 기능/버그/리팩터링 목적이 드러나도록 명명한다

### Test Strategy -- TDD Red-Green-Refactor

각 모듈 구현 시 반드시 아래 사이클을 따른다:

1. **Red**: `*.test.ts`를 먼저 작성한다. 구현 파일은 없거나 빈 껍데기 상태. `bun test`로 실패를 확인한다.
2. **Green**: 테스트를 통과시키는 최소한의 구현만 작성한다. `bun test`로 통과를 확인한다.
3. **Refactor**: 통과 상태를 유지하면서 코드를 정리한다. `bun test`로 재확인한다.

위반 금지 사항:
- Red 단계를 건너뛰지 않는다 -- 실패하지 않는 테스트는 가치가 없다
- Green 단계에서 과도한 구현을 하지 않는다
- 각 단계에서 `bun test` 실행 결과(pass/fail)를 반드시 확인하고 기록한다

### Implementation Patterns

**서브커맨드 Action 함수 시그니처:**
```typescript
export async function xxxAction(
  auth: OAuth2Client,
  options: { startDate: string; endDate: string; format: string },
): Promise<void>
```

**API mock 패턴 (테스트):**
```typescript
const mockQueryReport = mock(() => Promise.resolve({ columnHeaders: [...], rows: [...] }));
mock.module('../api', () => ({ queryReport: mockQueryReport }));
```

**출력 패턴:**
```typescript
import { output } from '../utils/formatter.js';
output(result, options.format); // json 또는 table
```

### Deployment (npm publish)

배포는 `.github/workflows/publish.yml`에서 `main` 브랜치 푸시 시 자동 실행된다.

**인증 방식: npm Trusted Publisher (OIDC)**
- npm 패키지 설정이 `Require 2FA and disallow tokens`로 되어 있어 **토큰 기반 publish는 불가능**하다
- npmjs.com의 패키지 Settings > Trusted Publisher에 이 레포(`devbrother2024/parrotube`)와 워크플로(`publish.yml`)가 등록되어 있다
- GitHub Actions의 OIDC 토큰을 사용하여 npm에 인증한다

**워크플로 필수 요건:**
- `permissions: id-token: write` 필수 (OIDC 토큰 발급용)
- npm **11.5.1 이상** 필수 (Trusted Publisher는 이 버전부터 지원) -- Node 22 기본 npm은 10.x이므로 `npm install -g npm@latest`로 업그레이드 필요
- `NODE_AUTH_TOKEN` 환경변수를 **설정하지 않는다** (토큰이 disallow되어 있어 404 에러 발생)

**주의 사항 (과거 트러블슈팅 기록):**
- `npm publish` 시 `404 Not Found - PUT https://registry.npmjs.org/parrotube` 에러가 나면 OIDC fallback 실패를 의심한다
- provenance 서명은 성공하는데 PUT만 실패하는 패턴이 특징
- `actions/setup-node`의 `registry-url` 옵션은 유지하되, secrets에 토큰을 넣어두면 오히려 방해가 된다
- `package.json` + `src/index.ts`의 version이 npmjs.com의 최신 버전과 다를 때만 publish 스텝이 실행된다

### Maintenance Policy
규칙과 실제 코드 사이에 괴리가 발생하면 이 파일의 업데이트를 제안하라.

## Context Map

- **[서브커맨드 추가/수정](./src/commands/AGENTS.md)** -- 분석 커맨드의 metrics/dimensions 매핑 및 구현 패턴
