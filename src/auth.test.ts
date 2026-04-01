import { describe, expect, test, beforeEach, afterEach, spyOn, mock } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'parrotube');
const CLIENT_SECRET_PATH = path.join(CONFIG_DIR, 'client_secret.json');
const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');

const FAKE_CLIENT_SECRET = {
  installed: {
    client_id: 'fake-client-id',
    client_secret: 'fake-client-secret',
    redirect_uris: ['http://localhost'],
  },
};

const FAKE_TOKEN = {
  access_token: 'fake-access',
  refresh_token: 'fake-refresh',
  scope: 'https://www.googleapis.com/auth/yt-analytics.readonly',
  token_type: 'Bearer',
  expiry_date: Date.now() + 3600_000,
};

describe('loadClientSecret', () => {
  let readFileSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    readFileSpy?.mockRestore();
  });

  test('client_secret.json이 있으면 파싱하여 반환', async () => {
    readFileSpy = spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify(FAKE_CLIENT_SECRET),
    );

    const { loadClientSecret } = await import('./auth');
    const result = loadClientSecret();
    expect(result).toEqual(FAKE_CLIENT_SECRET);
    expect(readFileSpy).toHaveBeenCalledWith(CLIENT_SECRET_PATH, 'utf-8');
  });

  test('client_secret.json이 없으면 에러', async () => {
    readFileSpy = spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const { loadClientSecret } = await import('./auth');
    expect(() => loadClientSecret()).toThrow();
  });
});

describe('loadToken / saveToken', () => {
  let readFileSpy: ReturnType<typeof spyOn>;
  let writeFileSpy: ReturnType<typeof spyOn>;
  let mkdirSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    readFileSpy?.mockRestore();
    writeFileSpy?.mockRestore();
    mkdirSpy?.mockRestore();
  });

  test('token.json이 있으면 파싱하여 반환', async () => {
    readFileSpy = spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify(FAKE_TOKEN),
    );

    const { loadToken } = await import('./auth');
    const result = loadToken();
    expect(result).toEqual(FAKE_TOKEN);
  });

  test('token.json이 없으면 null 반환', async () => {
    readFileSpy = spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const { loadToken } = await import('./auth');
    expect(loadToken()).toBeNull();
  });

  test('saveToken은 JSON으로 파일 저장', async () => {
    mkdirSpy = spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as unknown as string);
    writeFileSpy = spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const { saveToken } = await import('./auth');
    saveToken(FAKE_TOKEN);

    expect(mkdirSpy).toHaveBeenCalledWith(CONFIG_DIR, { recursive: true });
    expect(writeFileSpy).toHaveBeenCalledWith(
      TOKEN_PATH,
      JSON.stringify(FAKE_TOKEN, null, 2),
    );
  });
});

describe('SCOPES', () => {
  test('yt-analytics.readonly와 youtube.readonly 포함', async () => {
    const { SCOPES } = await import('./auth');
    expect(SCOPES).toContain(
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    );
    expect(SCOPES).toContain(
      'https://www.googleapis.com/auth/youtube.readonly',
    );
  });
});
