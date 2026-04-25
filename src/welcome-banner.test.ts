import { describe, expect, test } from 'bun:test';
import { printWelcomeBanner } from './welcome-banner';

function createWritableCapture(isTTY = true): {
  chunks: string[];
  stream: { isTTY?: boolean; write: (chunk: string) => boolean };
} {
  const chunks: string[] = [];
  return {
    chunks,
    stream: {
      isTTY,
      write: (chunk: string) => {
        chunks.push(chunk);
        return true;
      },
    },
  };
}

describe('welcome banner', () => {
  test('ANSI 모드에서는 전달된 stream에만 24-bit escape sequence와 reset code를 출력', () => {
    const { chunks, stream } = createWritableCapture();

    printWelcomeBanner(stream, {});

    const output = chunks.join('');
    expect(chunks).toHaveLength(1);
    expect(output).toContain('\x1b[38;2;');
    expect(output).toContain('\x1b[0m');
    expect(output).toContain('\n');
  });

  test('NO_COLOR 환경에서는 plain 배너를 출력', () => {
    const { chunks, stream } = createWritableCapture();

    printWelcomeBanner(stream, { NO_COLOR: '1' });

    expect(chunks.join('')).toBe('PARROTUBE\n');
  });

  test('TERM=dumb 환경에서는 plain 배너를 출력', () => {
    const { chunks, stream } = createWritableCapture();

    printWelcomeBanner(stream, { TERM: 'dumb' });

    expect(chunks.join('')).toBe('PARROTUBE\n');
  });

  test('stderr가 TTY가 아니면 plain 배너를 출력', () => {
    const { chunks, stream } = createWritableCapture(false);

    printWelcomeBanner(stream, {});

    expect(chunks.join('')).toBe('PARROTUBE\n');
  });
});
