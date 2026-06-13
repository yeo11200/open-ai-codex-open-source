/**
 * 정규식 패턴을 의미 단위 토큰으로 분해하는 결정론적 토크나이저.
 * AI에 의존하지 않고 패턴 구조를 정확히 해부한다 (Lens의 핵심 엔진).
 */

export type RegexTokenType =
  | 'anchor'
  | 'charClass'
  | 'group'
  | 'groupEnd'
  | 'quantifier'
  | 'set'
  | 'escape'
  | 'alternation'
  | 'dot'
  | 'backref'
  | 'literal';

export interface RegexToken {
  raw: string;
  type: RegexTokenType;
  label: string;
  description: string;
}

const CHAR_CLASS_DESC: Record<string, string> = {
  '\\d': '숫자 한 글자 (0-9)',
  '\\D': '숫자가 아닌 한 글자',
  '\\w': '단어 문자 한 글자 (영문/숫자/_)',
  '\\W': '단어 문자가 아닌 한 글자',
  '\\s': '공백 문자 (스페이스/탭/줄바꿈)',
  '\\S': '공백이 아닌 한 글자',
};

const ANCHOR_DESC: Record<string, string> = {
  '^': '문자열(또는 줄)의 시작',
  $: '문자열(또는 줄)의 끝',
  '\\b': '단어 경계',
  '\\B': '단어 경계가 아닌 위치',
};

const ESCAPE_DESC: Record<string, string> = {
  '\\n': '줄바꿈(LF)',
  '\\r': '캐리지 리턴(CR)',
  '\\t': '탭',
  '\\f': '폼 피드',
  '\\v': '세로 탭',
  '\\0': 'NULL 문자',
};

const describeGroupOpen = (raw: string): string => {
  if (raw === '(?:') return '캡처하지 않는 그룹';
  if (raw.startsWith('(?<') && !raw.startsWith('(?<=') && !raw.startsWith('(?<!')) {
    const name = raw.slice(3, -1);
    return `이름 있는 캡처 그룹 "${name}"`;
  }
  if (raw === '(?=') return '전방 탐색 (뒤에 ~가 오는 경우)';
  if (raw === '(?!') return '부정 전방 탐색 (뒤에 ~가 오지 않는 경우)';
  if (raw === '(?<=') return '후방 탐색 (앞에 ~가 있는 경우)';
  if (raw === '(?<!') return '부정 후방 탐색 (앞에 ~가 없는 경우)';
  return '캡처 그룹';
};

const describeQuantifier = (raw: string): string => {
  const lazy = raw.endsWith('?') && raw.length > 1 && raw !== '?';
  const core = lazy ? raw.slice(0, -1) : raw;
  const suffix = lazy ? ' (최소 매칭, lazy)' : '';

  if (core === '*') return `0번 이상 반복${suffix}`;
  if (core === '+') return `1번 이상 반복${suffix}`;
  if (core === '?') return `0번 또는 1번 (선택적)${suffix}`;

  const exact = core.match(/^\{(\d+)\}$/);
  if (exact) return `정확히 ${exact[1]}번 반복${suffix}`;
  const min = core.match(/^\{(\d+),\}$/);
  if (min) return `${min[1]}번 이상 반복${suffix}`;
  const range = core.match(/^\{(\d+),(\d+)\}$/);
  if (range) return `${range[1]}~${range[2]}번 반복${suffix}`;

  return '반복 수량자';
};

/** 패턴 위치에서 시작하는 수량자 원본을 읽는다. 없으면 null. */
const readQuantifier = (pattern: string, start: number): string | null => {
  const char = pattern[start];
  let raw: string;

  if (char === '*' || char === '+' || char === '?') {
    raw = char;
  } else if (char === '{') {
    const close = pattern.indexOf('}', start);
    if (close === -1) return null;
    const body = pattern.slice(start, close + 1);
    if (!/^\{\d+(,\d*)?\}$/.test(body)) return null;
    raw = body;
  } else {
    return null;
  }

  // 뒤따르는 ?는 lazy 수량자
  if (pattern[start + raw.length] === '?') raw += '?';
  return raw;
};

/** `[...]` 문자 집합의 끝 인덱스를 찾는다 (이스케이프/선두 ] 고려). */
const findSetEnd = (pattern: string, start: number): number => {
  let i = start + 1;
  if (pattern[i] === '^') i += 1;
  if (pattern[i] === ']') i += 1; // 선두 ]는 리터럴
  while (i < pattern.length) {
    if (pattern[i] === '\\') {
      i += 2;
      continue;
    }
    if (pattern[i] === ']') return i;
    i += 1;
  }
  return pattern.length - 1;
};

const describeSet = (raw: string): string => {
  const negated = raw.startsWith('[^');
  const inner = raw.slice(negated ? 2 : 1, -1);
  return negated ? `다음에 없는 문자 한 글자: ${inner}` : `다음 중 한 글자: ${inner}`;
};

/** 패턴 문자열을 토큰 배열로 분해한다. */
export const tokenizeRegex = (pattern: string): RegexToken[] => {
  const tokens: RegexToken[] = [];
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    // ── 이스케이프 시퀀스 ──
    if (char === '\\' && i + 1 < pattern.length) {
      const raw = pattern.slice(i, i + 2);
      const next = pattern[i + 1];

      if (CHAR_CLASS_DESC[raw]) {
        tokens.push({ raw, type: 'charClass', label: '문자 클래스', description: CHAR_CLASS_DESC[raw] });
      } else if (ANCHOR_DESC[raw]) {
        tokens.push({ raw, type: 'anchor', label: '경계', description: ANCHOR_DESC[raw] });
      } else if (ESCAPE_DESC[raw]) {
        tokens.push({ raw, type: 'escape', label: '제어 문자', description: ESCAPE_DESC[raw] });
      } else if (/[1-9]/.test(next)) {
        tokens.push({ raw, type: 'backref', label: '역참조', description: `${next}번 그룹과 동일한 내용` });
      } else {
        tokens.push({ raw, type: 'escape', label: '이스케이프', description: `문자 "${next}" 그대로 매칭` });
      }
      i += 2;
      continue;
    }

    // ── 문자 집합 [...] ──
    if (char === '[') {
      const end = findSetEnd(pattern, i);
      const raw = pattern.slice(i, end + 1);
      tokens.push({ raw, type: 'set', label: '문자 집합', description: describeSet(raw) });
      i = end + 1;
      continue;
    }

    // ── 그룹 시작 ──
    if (char === '(') {
      let raw = '(';
      const ahead = pattern.slice(i, i + 4);
      if (ahead.startsWith('(?<=') || ahead.startsWith('(?<!')) raw = ahead.slice(0, 4);
      else if (pattern.startsWith('(?:', i) || pattern.startsWith('(?=', i) || pattern.startsWith('(?!', i))
        raw = pattern.slice(i, i + 3);
      else if (pattern.startsWith('(?<', i)) {
        const close = pattern.indexOf('>', i);
        raw = close === -1 ? '(' : pattern.slice(i, close + 1);
      }
      tokens.push({ raw, type: 'group', label: '그룹', description: describeGroupOpen(raw) });
      i += raw.length;
      continue;
    }

    if (char === ')') {
      tokens.push({ raw: ')', type: 'groupEnd', label: '그룹 끝', description: '그룹 닫기' });
      i += 1;
      continue;
    }

    // ── 수량자 ──
    const quantifier = readQuantifier(pattern, i);
    if (quantifier) {
      tokens.push({
        raw: quantifier,
        type: 'quantifier',
        label: '수량자',
        description: describeQuantifier(quantifier),
      });
      i += quantifier.length;
      continue;
    }

    // ── 단일 메타 문자 ──
    if (char === '.') {
      tokens.push({ raw: '.', type: 'dot', label: '와일드카드', description: '줄바꿈을 제외한 모든 문자' });
      i += 1;
      continue;
    }
    if (char === '^' || char === '$') {
      tokens.push({ raw: char, type: 'anchor', label: '앵커', description: ANCHOR_DESC[char] });
      i += 1;
      continue;
    }
    if (char === '|') {
      tokens.push({ raw: '|', type: 'alternation', label: '또는', description: '왼쪽 또는 오른쪽 패턴 (OR)' });
      i += 1;
      continue;
    }

    // ── 리터럴 ──
    tokens.push({ raw: char, type: 'literal', label: '리터럴', description: `문자 "${char}" 그대로 매칭` });
    i += 1;
  }

  return tokens;
};
