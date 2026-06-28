import { describe, expect, test, mock, spyOn, afterEach } from 'bun:test';

const mockUploadCaption = mock(() =>
  Promise.resolve({
    id: 'caption-uploaded',
    snippet: {
      videoId: 'vid-123',
      language: 'ko',
      name: 'Korean captions',
      isDraft: false,
    },
  }),
);

mock.module('../data-api', () => ({ uploadCaption: mockUploadCaption }));

describe('dataCaptionsUploadAction', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    consoleSpy?.mockRestore();
    mockUploadCaption.mockClear();
  });

  test('필수 옵션과 draft 기본값을 uploadCaption에 전달한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCaptionsUploadAction } = await import('./data-captions-upload');

    await dataCaptionsUploadAction({} as never, {
      format: 'json',
      videoId: 'vid-123',
      file: './captions.vtt',
      language: 'ko',
      name: 'Korean captions',
      draft: false,
    });

    expect(mockUploadCaption).toHaveBeenCalledWith({
      auth: {},
      videoId: 'vid-123',
      filePath: './captions.vtt',
      language: 'ko',
      name: 'Korean captions',
      isDraft: false,
    });
  });

  test('draft 옵션을 true로 전달한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCaptionsUploadAction } = await import('./data-captions-upload');

    await dataCaptionsUploadAction({} as never, {
      format: 'json',
      videoId: 'vid-123',
      file: './captions.vtt',
      language: 'ko',
      name: 'Korean captions',
      draft: true,
    });

    expect(mockUploadCaption).toHaveBeenCalledWith(
      expect.objectContaining({ isDraft: true }),
    );
  });

  test('json 출력은 caption resource를 그대로 출력한다', async () => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const { dataCaptionsUploadAction } = await import('./data-captions-upload');

    await dataCaptionsUploadAction({} as never, {
      format: 'json',
      videoId: 'vid-123',
      file: './captions.vtt',
      language: 'ko',
      name: 'Korean captions',
      draft: false,
    });

    const parsed = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string) as {
      id: string;
    };
    expect(parsed.id).toBe('caption-uploaded');
  });
});
