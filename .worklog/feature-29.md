# Feature 29: 자막 업로드 커맨드 추가

## Summary

- Added `data:captions:upload` for YouTube caption track uploads.
- Added `youtube.force-ssl` OAuth scope validation and reauthorization guidance.
- Added tests for API wrapper, command action, auth scope handling, and CLI registration.

## Verification

- `bun test` passed: 138 pass, 0 fail.
- `bun run build` passed.
- `bun run dev data:captions:upload --help` showed the expected command options.
