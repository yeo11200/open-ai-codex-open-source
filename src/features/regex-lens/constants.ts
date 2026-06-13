/** 즉시 체험용 정규식 프리셋. 열자마자 살아있는 느낌을 주기 위한 예시들. */
export interface RegexPreset {
  label: string;
  pattern: string;
  flags: string;
  sample: string;
}

export const REGEX_PRESETS: RegexPreset[] = [
  {
    label: '이메일',
    pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+',
    flags: 'g',
    sample: '문의: hello@lumen.dev, 스팸 아님 nope@@x',
  },
  {
    label: 'URL',
    pattern: 'https?://[\\w.-]+(?:/[\\w./?%&=-]*)?',
    flags: 'g',
    sample: 'docs는 https://lumen.dev/guide 이고 http://x.io 도 있음',
  },
  {
    label: '날짜(YYYY-MM-DD)',
    pattern: '(\\d{4})-(\\d{2})-(\\d{2})',
    flags: 'g',
    sample: '출시 2026-06-13, 다음 2026-12-01',
  },
  {
    label: 'HEX 컬러',
    pattern: '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b',
    flags: 'g',
    sample: 'primary #ffb454, short #abc, 잘못된 #12',
  },
  {
    label: '한국 휴대폰',
    pattern: '01[016-9]-?\\d{3,4}-?\\d{4}',
    flags: 'g',
    sample: '연락처 010-1234-5678 또는 01098765432',
  },
];
