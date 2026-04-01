import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

mock.module('googleapis', () => ({
  google: {
    auth: { OAuth2: class {} },
    youtubeAnalytics: () => ({ reports: { query: mock(() => Promise.resolve({ data: {} })) } }),
  },
}));
mock.module('./auth', () => ({
  authenticate: mock(() => Promise.resolve()),
  getAuthClient: mock(() => Promise.resolve({})),
  SCOPES: [],
  loadClientSecret: mock(),
  loadToken: mock(),
  saveToken: mock(),
}));

describe('CLI program', () => {
  test('createProgram이 Commander 프로그램을 반환', async () => {
    const { createProgram } = await import('./index');
    const program = createProgram();
    expect(program.name()).toBe('parrotube');
  });

  test('공통 옵션 --period, --start-date, --end-date, --format 등록', async () => {
    const { createProgram } = await import('./index');
    const program = createProgram();

    const help = program.helpInformation();
    expect(help).toContain('--period');
    expect(help).toContain('--start-date');
    expect(help).toContain('--end-date');
    expect(help).toContain('--format');
  });

  test('서브커맨드 14개 등록 (auth + 12개 분석 + report)', async () => {
    const { createProgram } = await import('./index');
    const program = createProgram();

    const commandNames = program.commands.map((c) => c.name());
    expect(commandNames).toContain('auth');
    expect(commandNames).toContain('overview');
    expect(commandNames).toContain('demographics');
    expect(commandNames).toContain('geography');
    expect(commandNames).toContain('traffic');
    expect(commandNames).toContain('devices');
    expect(commandNames).toContain('top-videos');
    expect(commandNames).toContain('report');
    expect(commandNames).toContain('time-series');
    expect(commandNames).toContain('revenue');
    expect(commandNames).toContain('search-terms');
    expect(commandNames).toContain('sharing');
    expect(commandNames).toContain('video');
    expect(commandNames).toContain('query');
  });
});
