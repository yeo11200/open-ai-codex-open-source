/**
 * 정규식 실행 및 하이라이트 세그먼트 생성 유틸 (결정론적, AI 미사용).
 */

export interface RegexMatch {
  match: string;
  index: number;
  groups: Array<string | undefined>;
}

export interface MatchResult {
  ok: boolean;
  error?: string;
  matches: RegexMatch[];
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
  /** 매치 순번 (짝수/홀수 색 구분용) */
  matchIndex?: number;
}

/** 사용자 flags에 global을 보장한다 (전체 매치 탐색을 위해). */
const ensureGlobal = (flags: string): string => (flags.includes('g') ? flags : `${flags}g`);

export const runRegex = (pattern: string, flags: string, text: string): MatchResult => {
  if (!pattern) return { ok: true, matches: [] };

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, ensureGlobal(flags));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '유효하지 않은 정규식',
      matches: [],
    };
  }

  const matches: RegexMatch[] = [];
  let result: RegExpExecArray | null;
  let guard = 0;

  while ((result = regex.exec(text)) !== null) {
    matches.push({
      match: result[0],
      index: result.index,
      groups: result.slice(1),
    });

    // 길이 0 매치는 lastIndex를 강제 전진시켜 무한 루프를 막는다.
    if (result.index === regex.lastIndex) regex.lastIndex += 1;
    if (++guard > 10000) break;
  }

  return { ok: true, matches };
};

/** 매치 결과를 기반으로 하이라이트용 세그먼트 배열을 만든다. */
export const buildSegments = (text: string, matches: RegexMatch[]): HighlightSegment[] => {
  if (matches.length === 0) return [{ text, isMatch: false }];

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  matches.forEach((m, order) => {
    if (m.index > cursor) {
      segments.push({ text: text.slice(cursor, m.index), isMatch: false });
    }
    if (m.match.length > 0) {
      segments.push({ text: m.match, isMatch: true, matchIndex: order });
    }
    cursor = m.index + m.match.length;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments;
};
