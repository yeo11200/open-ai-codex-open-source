import { useCallback, useRef, useState } from 'react';

import { getProvider } from '@/lib/providers';
import type { ProviderTarget } from '@/store/playground/playgroundStore';
import { useSettingsStore } from '@/store/settings/settingsStore';

export type GenerateStatus = 'idle' | 'streaming' | 'done' | 'error';

export interface GeneratedRegex {
  pattern: string;
  flags: string;
  explanation: string;
}

export interface GenerateRequest {
  description: string;
  mustMatch: string[];
  mustNotMatch: string[];
}

const SYSTEM_PROMPT =
  '너는 정규식 생성 엔진이다. 사용자의 설명과 예시를 만족하는 JavaScript(ECMAScript) 정규식을 만든다. ' +
  '반드시 JSON 객체 하나만 출력한다. 코드블록이나 설명 문장을 덧붙이지 않는다.';

const buildPrompt = ({ description, mustMatch, mustNotMatch }: GenerateRequest): string => {
  const lines = [
    '아래 요구사항을 만족하는 정규식을 만들어줘.',
    '',
    `설명: ${description}`,
  ];

  if (mustMatch.length > 0) {
    lines.push('', '반드시 매칭되어야 하는 예시:');
    mustMatch.forEach((example) => lines.push(`- ${example}`));
  }
  if (mustNotMatch.length > 0) {
    lines.push('', '매칭되면 안 되는 예시:');
    mustNotMatch.forEach((example) => lines.push(`- ${example}`));
  }

  lines.push(
    '',
    '다음 JSON 형식으로만 답해라:',
    '{"pattern": "정규식 본문(앞뒤 슬래시 제외)", "flags": "g 등 플래그", "explanation": "한 줄 설명"}',
  );

  return lines.join('\n');
};

/** 스트리밍으로 받은 텍스트에서 JSON 객체만 추출해 파싱한다. */
const parseGenerated = (raw: string): GeneratedRegex | null => {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<GeneratedRegex>;
    if (typeof parsed.pattern !== 'string') return null;

    // 혹시 모델이 /.../g 형태로 감싸 보냈다면 슬래시를 벗긴다.
    const cleaned = parsed.pattern.replace(/^\/(.*)\/([gimsuy]*)$/, '$1');
    const flags = (parsed.flags ?? 'g').replace(/[^gimsuy]/g, '') || 'g';

    // 실제로 컴파일되는지 검증한다.
    new RegExp(cleaned, flags);

    return {
      pattern: cleaned,
      flags,
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
    };
  } catch {
    return null;
  }
};

/**
 * 자연어 설명 + 예시 → AI가 정규식을 생성하는 훅.
 * 결과는 컴파일 검증을 거쳐 반환되며, 예시 기반 검증은 호출 측에서 매처로 수행한다.
 */
export const useRegexGenerator = () => {
  const [status, setStatus] = useState<GenerateStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (request: GenerateRequest, target: ProviderTarget): Promise<GeneratedRegex | null> => {
      if (!request.description.trim()) return null;

      const provider = getProvider(target.providerId);
      const credentials = useSettingsStore.getState().getCredentials(target.providerId);
      const controller = new AbortController();
      abortRef.current = controller;

      setError(undefined);
      setStatus('streaming');

      let buffer = '';
      try {
        await provider.streamChat(
          {
            model: target.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildPrompt(request) },
            ],
            temperature: 0,
            signal: controller.signal,
          },
          credentials,
          (delta) => {
            buffer += delta;
          },
        );

        const result = parseGenerated(buffer);
        if (!result) {
          setStatus('error');
          setError('AI 응답에서 유효한 정규식을 추출하지 못했습니다. 다시 시도해보세요.');
          return null;
        }

        setStatus('done');
        return result;
      } catch (caught) {
        if (controller.signal.aborted) {
          setStatus('idle');
          return null;
        }
        setStatus('error');
        setError(caught instanceof Error ? caught.message : '알 수 없는 오류');
        return null;
      } finally {
        abortRef.current = null;
      }
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { status, error, generate, stop };
};
