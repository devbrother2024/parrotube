import { describe, expect, test, mock, afterEach, beforeEach } from 'bun:test';

// mock global fetch before importing module
const mockFetch = mock<(url: string | URL | Request, init?: RequestInit) => Promise<Response>>(() =>
  Promise.resolve(new Response('', { status: 200 })),
);

const originalFetch = globalThis.fetch;

describe('transcript', () => {
  beforeEach(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockFetch.mockClear();
  });

  describe('extractCaptionTracks', () => {
    test('playerResponse에서 captionTracks 배열을 추출한다', async () => {
      const { extractCaptionTracks } = await import('./transcript');
      const playerResponse = {
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              {
                baseUrl: 'https://www.youtube.com/timedtext?v=abc&lang=ko',
                name: { simpleText: '한국어' },
                languageCode: 'ko',
                kind: 'asr',
              },
              {
                baseUrl: 'https://www.youtube.com/timedtext?v=abc&lang=en',
                name: { simpleText: 'English' },
                languageCode: 'en',
              },
            ],
          },
        },
      };

      const tracks = extractCaptionTracks(playerResponse);
      expect(tracks).toHaveLength(2);
      expect(tracks[0]).toEqual({
        languageCode: 'ko',
        name: '한국어',
        baseUrl: 'https://www.youtube.com/timedtext?v=abc&lang=ko',
        kind: 'asr',
      });
      expect(tracks[1]).toEqual({
        languageCode: 'en',
        name: 'English',
        baseUrl: 'https://www.youtube.com/timedtext?v=abc&lang=en',
        kind: undefined,
      });
    });

    test('captions가 없으면 빈 배열을 반환한다', async () => {
      const { extractCaptionTracks } = await import('./transcript');
      expect(extractCaptionTracks({})).toEqual([]);
      expect(extractCaptionTracks({ captions: {} })).toEqual([]);
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
      const tracks = [
        { languageCode: 'ko', name: '한국어', baseUrl: 'url-ko', kind: 'asr' },
      ];

      expect(() => selectTrack(tracks, 'ja')).toThrow();
    });

    test('트랙이 비어있으면 에러를 throw한다', async () => {
      const { selectTrack } = await import('./transcript');
      expect(() => selectTrack([])).toThrow();
    });
  });

  describe('parseTimedTextXml', () => {
    test('XML에서 TranscriptSegment 배열을 파싱한다', async () => {
      const { parseTimedTextXml } = await import('./transcript');
      const xml = `<?xml version="1.0" encoding="utf-8" ?>
<transcript>
  <text start="0" dur="3.5">Hello world</text>
  <text start="3.5" dur="2.1">This is a test</text>
</transcript>`;

      const segments = parseTimedTextXml(xml);
      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ text: 'Hello world', start: 0, duration: 3.5 });
      expect(segments[1]).toEqual({ text: 'This is a test', start: 3.5, duration: 2.1 });
    });

    test('HTML 엔티티를 디코딩한다', async () => {
      const { parseTimedTextXml } = await import('./transcript');
      const xml = `<transcript>
  <text start="0" dur="1">Tom &amp; Jerry</text>
  <text start="1" dur="1">It&#39;s fine</text>
  <text start="2" dur="1">&lt;hello&gt;</text>
  <text start="3" dur="1">&quot;quoted&quot;</text>
</transcript>`;

      const segments = parseTimedTextXml(xml);
      expect(segments[0].text).toBe('Tom & Jerry');
      expect(segments[1].text).toBe("It's fine");
      expect(segments[2].text).toBe('<hello>');
      expect(segments[3].text).toBe('"quoted"');
    });

    test('빈 XML이면 빈 배열을 반환한다', async () => {
      const { parseTimedTextXml } = await import('./transcript');
      expect(parseTimedTextXml('')).toEqual([]);
      expect(parseTimedTextXml('<transcript></transcript>')).toEqual([]);
    });

    test('줄바꿈이 포함된 텍스트를 처리한다', async () => {
      const { parseTimedTextXml } = await import('./transcript');
      const xml = `<transcript>
  <text start="0" dur="2">line one\nline two</text>
</transcript>`;

      const segments = parseTimedTextXml(xml);
      expect(segments[0].text).toBe('line one\nline two');
    });
  });

  describe('fetchTranscript', () => {
    test('innertube API를 호출하고 자막을 반환한다', async () => {
      const playerResponse = {
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              {
                baseUrl: 'https://www.youtube.com/timedtext?v=test123&lang=ko',
                name: { simpleText: '한국어 (자동 생성)' },
                languageCode: 'ko',
                kind: 'asr',
              },
            ],
          },
        },
      };

      const timedTextXml = `<transcript>
  <text start="0" dur="3">안녕하세요</text>
  <text start="3" dur="2">테스트입니다</text>
</transcript>`;

      mockFetch
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify(playerResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(timedTextXml, { status: 200 })),
        );

      const { fetchTranscript } = await import('./transcript');
      const result = await fetchTranscript('test123');

      expect(result.videoId).toBe('test123');
      expect(result.language).toBe('ko');
      expect(result.isAutoGenerated).toBe(true);
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]).toEqual({ text: '안녕하세요', start: 0, duration: 3 });
    });

    test('지정한 언어의 자막을 가져온다', async () => {
      const playerResponse = {
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              {
                baseUrl: 'https://www.youtube.com/timedtext?v=test123&lang=ko',
                name: { simpleText: '한국어' },
                languageCode: 'ko',
                kind: 'asr',
              },
              {
                baseUrl: 'https://www.youtube.com/timedtext?v=test123&lang=en',
                name: { simpleText: 'English' },
                languageCode: 'en',
              },
            ],
          },
        },
      };

      const timedTextXml = `<transcript><text start="0" dur="1">Hello</text></transcript>`;

      mockFetch
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify(playerResponse), { status: 200 })),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(timedTextXml, { status: 200 })),
        );

      const { fetchTranscript } = await import('./transcript');
      const result = await fetchTranscript('test123', 'en');

      expect(result.language).toBe('en');
      expect(result.isAutoGenerated).toBe(false);
    });

    test('자막이 없는 영상이면 에러를 throw한다', async () => {
      const playerResponse = { captions: {} };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify(playerResponse), { status: 200 })),
      );

      const { fetchTranscript } = await import('./transcript');
      await expect(fetchTranscript('no-captions')).rejects.toThrow();
    });

    test('innertube API 호출 실패 시 에러를 throw한다', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(new Response('', { status: 500 })),
      );

      const { fetchTranscript } = await import('./transcript');
      await expect(fetchTranscript('fail-video')).rejects.toThrow();
    });
  });

  describe('listAvailableTracks', () => {
    test('사용 가능한 자막 트랙 목록을 반환한다', async () => {
      const playerResponse = {
        captions: {
          playerCaptionsTracklistRenderer: {
            captionTracks: [
              {
                baseUrl: 'https://www.youtube.com/timedtext?v=abc&lang=ko',
                name: { simpleText: '한국어 (자동 생성)' },
                languageCode: 'ko',
                kind: 'asr',
              },
              {
                baseUrl: 'https://www.youtube.com/timedtext?v=abc&lang=en',
                name: { simpleText: 'English' },
                languageCode: 'en',
              },
            ],
          },
        },
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify(playerResponse), { status: 200 })),
      );

      const { listAvailableTracks } = await import('./transcript');
      const tracks = await listAvailableTracks('abc');

      expect(tracks).toHaveLength(2);
      expect(tracks[0].languageCode).toBe('ko');
      expect(tracks[0].kind).toBe('asr');
      expect(tracks[1].languageCode).toBe('en');
    });
  });
});
