import { describe, expect, test, mock, afterEach, beforeEach } from 'bun:test';

// yt-dlp subprocess mock
const mockExecFile = mock<
  (cmd: string, args: string[], opts: Record<string, unknown>) => Promise<{ stdout: string; stderr: string }>
>(() => Promise.resolve({ stdout: '', stderr: '' }));

mock.module('node:child_process', () => ({
  execFile: (
    cmd: string,
    args: string[],
    opts: Record<string, unknown>,
    cb: (err: Error | null, stdout: string, stderr: string) => void,
  ) => {
    mockExecFile(cmd, args, opts)
      .then((r) => cb(null, r.stdout, r.stderr))
      .catch((e) => cb(e, '', ''));
  },
}));

// fetch mock for json3 URL
const mockFetch = mock<(url: string | URL | Request, init?: RequestInit) => Promise<Response>>(() =>
  Promise.resolve(new Response('', { status: 200 })),
);

const originalFetch = globalThis.fetch;

// yt-dlp --dump-json 샘플 응답
function makeDumpJson(opts?: {
  subtitles?: Record<string, Array<{ ext: string; url: string }>>;
  automatic_captions?: Record<string, Array<{ ext: string; url: string }>>;
}) {
  return JSON.stringify({
    id: 'test123',
    title: 'Test Video',
    subtitles: opts?.subtitles ?? {},
    automatic_captions: opts?.automatic_captions ?? {},
  });
}

describe('transcript', () => {
  beforeEach(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockFetch.mockClear();
    mockExecFile.mockClear();
  });

  describe('parseJson3Subtitles', () => {
    test('json3 events를 TranscriptSegment[]로 변환한다', async () => {
      const { parseJson3Subtitles } = await import('./transcript');
      const json3 = {
        events: [
          { tStartMs: 1400, dDurationMs: 1700, segs: [{ utf8: 'Hello' }] },
          { tStartMs: 3100, dDurationMs: 2000, segs: [{ utf8: 'World' }] },
        ],
      };

      const segments = parseJson3Subtitles(json3);
      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ text: 'Hello', start: 1.4, duration: 1.7 });
      expect(segments[1]).toEqual({ text: 'World', start: 3.1, duration: 2 });
    });

    test('segs가 없는 이벤트는 스킵한다', async () => {
      const { parseJson3Subtitles } = await import('./transcript');
      const json3 = {
        events: [
          { tStartMs: 0, dDurationMs: 1000 }, // segs 없음
          { tStartMs: 1000, dDurationMs: 500, segs: [{ utf8: 'Hello' }] },
          { tStartMs: 1500, dDurationMs: 0 }, // segs 없음
        ],
      };

      const segments = parseJson3Subtitles(json3);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('Hello');
    });

    test('빈 events 배열이면 빈 배열을 반환한다', async () => {
      const { parseJson3Subtitles } = await import('./transcript');
      expect(parseJson3Subtitles({ events: [] })).toEqual([]);
    });

    test('여러 segs를 join한다', async () => {
      const { parseJson3Subtitles } = await import('./transcript');
      const json3 = {
        events: [
          {
            tStartMs: 0,
            dDurationMs: 2000,
            segs: [{ utf8: 'Hello ' }, { utf8: 'World' }],
          },
        ],
      };

      const segments = parseJson3Subtitles(json3);
      expect(segments[0].text).toBe('Hello World');
    });

    test('ms를 초 단위로 정확히 변환한다', async () => {
      const { parseJson3Subtitles } = await import('./transcript');
      const json3 = {
        events: [{ tStartMs: 18600, dDurationMs: 3200, segs: [{ utf8: 'test' }] }],
      };

      const segments = parseJson3Subtitles(json3);
      expect(segments[0].start).toBe(18.6);
      expect(segments[0].duration).toBe(3.2);
    });
  });

  describe('selectTrack', () => {
    test('lang 지정 시 해당 언어 트랙을 선택한다', async () => {
      const { selectTrack } = await import('./transcript');
      const tracks = [
        { languageCode: 'ko', name: '한국어', baseUrl: 'url-ko', kind: 'asr' },
        { languageCode: 'en', name: 'English', baseUrl: 'url-en', kind: undefined },
      ];

      const track = selectTrack(tracks, 'en');
      expect(track.languageCode).toBe('en');
    });

    test('lang 미지정 시 첫 번째 트랙을 선택한다', async () => {
      const { selectTrack } = await import('./transcript');
      const tracks = [
        { languageCode: 'ko', name: '한국어', baseUrl: 'url-ko', kind: 'asr' },
        { languageCode: 'en', name: 'English', baseUrl: 'url-en', kind: undefined },
      ];

      const track = selectTrack(tracks);
      expect(track.languageCode).toBe('ko');
    });

    test('해당 언어가 없으면 에러를 throw한다', async () => {
      const { selectTrack } = await import('./transcript');
      const tracks = [{ languageCode: 'ko', name: '한국어', baseUrl: 'url-ko', kind: 'asr' }];

      expect(() => selectTrack(tracks, 'ja')).toThrow();
    });

    test('트랙이 비어있으면 에러를 throw한다', async () => {
      const { selectTrack } = await import('./transcript');
      expect(() => selectTrack([])).toThrow();
    });
  });

  describe('fetchTranscript', () => {
    test('yt-dlp로 자막을 가져와 반환한다', async () => {
      const dumpJson = makeDumpJson({
        subtitles: {
          ko: [
            { ext: 'json3', url: 'https://example.com/ko.json3' },
            { ext: 'vtt', url: 'https://example.com/ko.vtt' },
          ],
        },
      });

      mockExecFile.mockImplementationOnce(() => Promise.resolve({ stdout: dumpJson, stderr: '' }));

      const json3Data = JSON.stringify({
        events: [
          { tStartMs: 0, dDurationMs: 3000, segs: [{ utf8: '안녕하세요' }] },
          { tStartMs: 3000, dDurationMs: 2000, segs: [{ utf8: '테스트입니다' }] },
        ],
      });
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(new Response(json3Data, { status: 200 })),
      );

      const { fetchTranscript } = await import('./transcript');
      const result = await fetchTranscript('test123');

      expect(result.videoId).toBe('test123');
      expect(result.language).toBe('ko');
      expect(result.isAutoGenerated).toBe(false);
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]).toEqual({ text: '안녕하세요', start: 0, duration: 3 });
    });

    test('지정한 언어의 자막을 가져온다', async () => {
      const dumpJson = makeDumpJson({
        subtitles: {
          ko: [{ ext: 'json3', url: 'https://example.com/ko.json3' }],
          en: [{ ext: 'json3', url: 'https://example.com/en.json3' }],
        },
      });

      mockExecFile.mockImplementationOnce(() => Promise.resolve({ stdout: dumpJson, stderr: '' }));
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: 'Hello' }] }] }),
            { status: 200 },
          ),
        ),
      );

      const { fetchTranscript } = await import('./transcript');
      const result = await fetchTranscript('test123', 'en');

      expect(result.language).toBe('en');
      expect(result.isAutoGenerated).toBe(false);
    });

    test('자동 생성 자막을 가져온다', async () => {
      const dumpJson = makeDumpJson({
        automatic_captions: {
          ko: [{ ext: 'json3', url: 'https://example.com/ko-auto.json3' }],
        },
      });

      mockExecFile.mockImplementationOnce(() => Promise.resolve({ stdout: dumpJson, stderr: '' }));
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: 'test' }] }] }),
            { status: 200 },
          ),
        ),
      );

      const { fetchTranscript } = await import('./transcript');
      const result = await fetchTranscript('test123');

      expect(result.isAutoGenerated).toBe(true);
    });

    test('자막이 없는 영상이면 에러를 throw한다', async () => {
      const dumpJson = makeDumpJson({});
      mockExecFile.mockImplementationOnce(() => Promise.resolve({ stdout: dumpJson, stderr: '' }));

      const { fetchTranscript } = await import('./transcript');
      await expect(fetchTranscript('no-captions')).rejects.toThrow();
    });

    test('yt-dlp 실행 실패 시 에러를 throw한다', async () => {
      mockExecFile.mockImplementationOnce(() =>
        Promise.reject(new Error('yt-dlp exited with code 1')),
      );

      const { fetchTranscript } = await import('./transcript');
      await expect(fetchTranscript('fail-video')).rejects.toThrow();
    });

    test('yt-dlp 미설치 시 안내 메시지를 포함한 에러를 throw한다', async () => {
      const err = new Error('spawn yt-dlp ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockExecFile.mockImplementationOnce(() => Promise.reject(err));

      const { fetchTranscript } = await import('./transcript');
      await expect(fetchTranscript('test123')).rejects.toThrow(/yt-dlp.*install/i);
    });
  });

  describe('listAvailableTracks', () => {
    test('수동/자동 자막 트랙 목록을 반환한다', async () => {
      const dumpJson = makeDumpJson({
        subtitles: {
          en: [{ ext: 'json3', url: 'https://example.com/en.json3' }],
          ko: [{ ext: 'json3', url: 'https://example.com/ko.json3' }],
        },
        automatic_captions: {
          ja: [{ ext: 'json3', url: 'https://example.com/ja-auto.json3' }],
        },
      });

      mockExecFile.mockImplementationOnce(() => Promise.resolve({ stdout: dumpJson, stderr: '' }));

      const { listAvailableTracks } = await import('./transcript');
      const tracks = await listAvailableTracks('abc');

      expect(tracks.length).toBe(3);
      // 수동 자막이 먼저
      const manual = tracks.filter((t) => t.kind !== 'asr');
      const auto = tracks.filter((t) => t.kind === 'asr');
      expect(manual.length).toBe(2);
      expect(auto.length).toBe(1);
      expect(auto[0].languageCode).toBe('ja');
    });
  });
});
