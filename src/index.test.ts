import { describe, expect, test, mock } from 'bun:test';

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

let welcomeBannerModuleLoaded = false;
const mockPrintWelcomeBanner = mock(() => undefined);
mock.module('./welcome-banner.js', () => {
  welcomeBannerModuleLoaded = true;
  return {
    printWelcomeBanner: mockPrintWelcomeBanner,
  };
});

describe('CLI program', () => {
  test('index 모듈 로드 시 welcome banner 모듈을 eager import하지 않는다', async () => {
    welcomeBannerModuleLoaded = false;

    await import('./index');

    expect(welcomeBannerModuleLoaded).toBe(false);
  });

  test('createProgram이 Commander 프로그램을 반환', async () => {
    const { createProgram } = await import('./index');
    const program = createProgram();
    expect(program.name()).toBe('parrotube');
  });

  test('top-level no args, --help, -h, help만 welcome banner 표시 대상', async () => {
    const { shouldPrintWelcomeBanner } = await import('./index');

    expect(shouldPrintWelcomeBanner(['node', 'parrotube'])).toBe(true);
    expect(shouldPrintWelcomeBanner(['node', 'parrotube', '--help'])).toBe(true);
    expect(shouldPrintWelcomeBanner(['node', 'parrotube', '-h'])).toBe(true);
    expect(shouldPrintWelcomeBanner(['node', 'parrotube', 'help'])).toBe(true);
    expect(shouldPrintWelcomeBanner(['node', 'parrotube', 'overview'])).toBe(false);
    expect(shouldPrintWelcomeBanner(['node', 'parrotube', 'data:comments'])).toBe(false);
    expect(shouldPrintWelcomeBanner(['node', 'parrotube', 'overview', '--help'])).toBe(false);
    expect(shouldPrintWelcomeBanner(['node', 'parrotube', 'help', 'overview'])).toBe(false);
  });


  test('runCli는 top-level no args에서만 welcome banner를 출력한다', async () => {
    mockPrintWelcomeBanner.mockClear();
    const { runCli } = await import('./index');

    await runCli(['node', 'parrotube']);

    expect(mockPrintWelcomeBanner).toHaveBeenCalledTimes(1);
  });

  test('공통 옵션 --period, --start-date, --end-date, --format 등록', async () => {
    const { createProgram } = await import('./index');
    const program = createProgram();

    const help = program.helpInformation();
    expect(help).toContain('Usage: parrotube');
    expect(help).toContain('--period');
    expect(help).toContain('--start-date');
    expect(help).toContain('--end-date');
    expect(help).toContain('--format');
  });

  test('서브커맨드 26개 등록 (analytics + data api)', async () => {
    const { createProgram } = await import('./index');
    const program = createProgram();

    const commandNames = program.commands.map((c) => c.name());
    expect(commandNames).toHaveLength(26);
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
    expect(commandNames).toContain('data:comments');
    expect(commandNames).toContain('data:channel');
    expect(commandNames).toContain('data:videos');
    expect(commandNames).toContain('data:playlists');
    expect(commandNames).toContain('data:playlist-items');
    expect(commandNames).toContain('data:search');
    expect(commandNames).toContain('data:subscriptions');
    expect(commandNames).toContain('data:activities');
    expect(commandNames).toContain('data:captions');
    expect(commandNames).toContain('data:transcript');
    expect(commandNames).toContain('data:categories');
    expect(commandNames).toContain('data:i18n');
  });
});
