import type { PlaygroundDraft } from '@/store/playground/playgroundStore';

/** 공유 링크에 draft를 싣는 쿼리 파라미터 키 */
export const SHARE_PARAM = 'p';

/** 유니코드 안전 base64url 인코딩 */
const toBase64Url = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (input: string): string => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/** draft를 공유용 토큰으로 직렬화한다 */
export const encodeDraft = (draft: PlaygroundDraft): string =>
  toBase64Url(JSON.stringify(draft));

/** 공유 토큰을 draft로 복원한다. 형식이 깨지면 null */
export const decodeDraft = (token: string): PlaygroundDraft | null => {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as PlaygroundDraft;
    if (!parsed || typeof parsed.user !== 'string' || !Array.isArray(parsed.targets)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/** 현재 위치 기반 공유 URL을 만든다 (HashRouter 해시 보존) */
export const buildShareUrl = (draft: PlaygroundDraft): string => {
  const token = encodeDraft(draft);
  const { origin, pathname, hash } = window.location;
  const [hashPath = '#/'] = hash.split('?');
  return `${origin}${pathname}${hashPath}?${SHARE_PARAM}=${token}`;
};
