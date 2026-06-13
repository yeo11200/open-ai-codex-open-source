import { useCallback, useRef, useState } from 'react';

import { getProvider } from '@/lib/providers';
import type { ProviderTarget } from '@/store/playground/playgroundStore';
import { useSettingsStore } from '@/store/settings/settingsStore';

type ExplainStatus = 'idle' | 'streaming' | 'done' | 'error';

const buildPrompt = (pattern: string, flags: string): string =>
  [
    '다음 정규식을 한국어로 설명해줘. 초보자도 이해할 수 있게 간결하게.',
    '',
    `패턴: /${pattern}/${flags}`,
    '',
    '형식:',
    '1. 한 줄 요약',
    '2. 동작 설명 (핵심 부분 위주)',
    '3. 매칭되는 예시 2개, 매칭 안 되는 예시 1개',
  ].join('\n');

const SYSTEM_PROMPT =
  '너는 정규식(Regular Expression) 전문가다. 정확하면서도 쉽게 설명한다. 마크다운을 적절히 사용한다.';

/**
 * 정규식을 AI로 평어 설명하는 훅.
 * Playground와 동일한 프로바이더 엔진을 재사용한다 (단일 타깃 스트리밍).
 */
export const useRegexExplainer = () => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<ExplainStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const explain = useCallback(async (pattern: string, flags: string, target: ProviderTarget) => {
    if (!pattern.trim()) return;

    const provider = getProvider(target.providerId);
    const credentials = useSettingsStore.getState().getCredentials(target.providerId);
    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setError(undefined);
    setStatus('streaming');

    try {
      await provider.streamChat(
        {
          model: target.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildPrompt(pattern, flags) },
          ],
          temperature: 0.2,
          signal: controller.signal,
        },
        credentials,
        (delta) => setText((prev) => prev + delta),
      );
      setStatus('done');
    } catch (caught) {
      if (controller.signal.aborted) {
        setStatus('idle');
        return;
      }
      setStatus('error');
      setError(caught instanceof Error ? caught.message : '알 수 없는 오류');
    } finally {
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { text, status, error, explain, stop };
};
