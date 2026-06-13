import { useCallback, useRef, useState } from 'react';

import type { ChatMessage, TokenUsage } from '@/lib/providers';
import { getProvider } from '@/lib/providers';
import type { PlaygroundDraft, ProviderTarget } from '@/store/playground/playgroundStore';
import { useSettingsStore } from '@/store/settings/settingsStore';

export type RunStatus = 'idle' | 'streaming' | 'done' | 'error';

export interface TargetRunState {
  status: RunStatus;
  text: string;
  error?: string;
  usage?: TokenUsage;
  elapsedMs?: number;
}

type RunMap = Record<string, TargetRunState>;

/** 타깃을 상태 맵의 키로 직렬화한다 (provider + model 조합이 유일) */
export const targetKey = (target: ProviderTarget): string =>
  `${target.providerId}::${target.model}`;

const buildMessages = (draft: PlaygroundDraft): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  if (draft.system.trim()) messages.push({ role: 'system', content: draft.system });
  messages.push({ role: 'user', content: draft.user });
  return messages;
};

const INITIAL_STATE: TargetRunState = { status: 'idle', text: '' };

/**
 * Playground 실행 엔진 훅.
 * draft의 모든 타깃에 동시에 스트리밍 요청을 보내고 타깃별 상태를 관리한다.
 */
export const usePlaygroundRunner = () => {
  const [runs, setRuns] = useState<RunMap>({});
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const patchRun = useCallback((key: string, patch: Partial<TargetRunState>) => {
    setRuns((prev) => ({ ...prev, [key]: { ...(prev[key] ?? INITIAL_STATE), ...patch } }));
  }, []);

  const runSingle = useCallback(
    async (target: ProviderTarget, draft: PlaygroundDraft, signal: AbortSignal) => {
      const key = targetKey(target);
      const provider = getProvider(target.providerId);
      const credentials = useSettingsStore.getState().getCredentials(target.providerId);

      patchRun(key, { status: 'streaming', text: '', error: undefined, usage: undefined });
      const startedAt = Date.now();

      try {
        const result = await provider.streamChat(
          {
            model: target.model,
            messages: buildMessages(draft),
            temperature: draft.temperature,
            signal,
          },
          credentials,
          (delta) => {
            setRuns((prev) => {
              const current = prev[key] ?? INITIAL_STATE;
              return { ...prev, [key]: { ...current, text: current.text + delta } };
            });
          },
        );

        patchRun(key, {
          status: 'done',
          text: result.text,
          usage: result.usage,
          elapsedMs: Date.now() - startedAt,
        });
      } catch (error) {
        if (signal.aborted) {
          patchRun(key, { status: 'done', elapsedMs: Date.now() - startedAt });
          return;
        }
        patchRun(key, {
          status: 'error',
          error: error instanceof Error ? error.message : '알 수 없는 오류',
          elapsedMs: Date.now() - startedAt,
        });
      }
    },
    [patchRun],
  );

  const run = useCallback(
    async (draft: PlaygroundDraft) => {
      if (draft.targets.length === 0 || !draft.user.trim()) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);

      await Promise.allSettled(
        draft.targets.map((target) => runSingle(target, draft, controller.signal)),
      );

      setIsRunning(false);
      abortRef.current = null;
    },
    [runSingle],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }, []);

  return { runs, isRunning, run, stop };
};
