# feat/welcome-banner-logo

## Summary

- README 상단에 parrotube 로고 이미지를 추가했다.
- CLI top-level help 진입점에 welcome banner를 stderr로 출력하도록 추가했다.
- stdout 구조화 출력 계약을 유지하기 위해 subcommand와 subcommand help에서는 banner를 출력하지 않는다.
- 비TTY stderr에서는 ANSI banner 대신 plain banner를 출력해 pipe/capture 환경에서 truncation/reset 누락 위험을 피한다.
- package version을 0.4.0으로 올리고 npm files에 assets를 포함했다.

## Verification

- `bun test`
- `bun run build`
- `bun src/index.ts --help`
- `bun src/index.ts overview --help`
- `npm_config_cache=/tmp/parrotube-npm-cache npm pack --dry-run`
