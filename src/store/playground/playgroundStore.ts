import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ProviderId } from '@/lib/providers';

/** 실행 대상: 어떤 프로바이더의 어떤 모델에 보낼지 */
export interface ProviderTarget {
  providerId: ProviderId;
  model: string;
}

/** 현재 편집 중인 프롬프트 구성 */
export interface PlaygroundDraft {
  system: string;
  user: string;
  temperature: number;
  targets: ProviderTarget[];
}

/** 컬렉션에 저장된 프롬프트 */
export interface SavedPrompt extends PlaygroundDraft {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface PlaygroundState {
  draft: PlaygroundDraft;
  saved: SavedPrompt[];

  setSystem: (system: string) => void;
  setUser: (user: string) => void;
  setTemperature: (temperature: number) => void;
  toggleTarget: (target: ProviderTarget) => void;
  replaceDraft: (draft: PlaygroundDraft) => void;

  savePrompt: (title: string) => void;
  deletePrompt: (id: string) => void;
  loadPrompt: (id: string) => void;
}

const DEFAULT_DRAFT: PlaygroundDraft = {
  system: '당신은 간결하고 정확한 시니어 엔지니어입니다.',
  user: 'React에서 useMemo와 useCallback의 차이를 한 문단으로 설명해줘.',
  temperature: 0.7,
  targets: [{ providerId: 'openai', model: 'gpt-4o-mini' }],
};

const isSameTarget = (a: ProviderTarget, b: ProviderTarget): boolean =>
  a.providerId === b.providerId && a.model === b.model;

const now = (): number => Date.now();

/**
 * Playground 상태 스토어.
 * 편집 중인 draft와 저장된 컬렉션(saved)을 분리해 관리한다.
 */
export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set, get) => ({
      draft: DEFAULT_DRAFT,
      saved: [],

      setSystem: (system) => set((state) => ({ draft: { ...state.draft, system } })),
      setUser: (user) => set((state) => ({ draft: { ...state.draft, user } })),
      setTemperature: (temperature) =>
        set((state) => ({ draft: { ...state.draft, temperature } })),

      toggleTarget: (target) =>
        set((state) => {
          const exists = state.draft.targets.some((t) => isSameTarget(t, target));
          const targets = exists
            ? state.draft.targets.filter((t) => !isSameTarget(t, target))
            : [...state.draft.targets, target];
          return { draft: { ...state.draft, targets } };
        }),

      replaceDraft: (draft) => set({ draft }),

      savePrompt: (title) =>
        set((state) => {
          const timestamp = now();
          const prompt: SavedPrompt = {
            ...state.draft,
            id: crypto.randomUUID(),
            title: title.trim() || '제목 없는 프롬프트',
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          return { saved: [prompt, ...state.saved] };
        }),

      deletePrompt: (id) =>
        set((state) => ({ saved: state.saved.filter((p) => p.id !== id) })),

      loadPrompt: (id) => {
        const prompt = get().saved.find((p) => p.id === id);
        if (!prompt) return;
        set({
          draft: {
            system: prompt.system,
            user: prompt.user,
            temperature: prompt.temperature,
            targets: prompt.targets,
          },
        });
      },
    }),
    {
      name: 'lumen.playground',
      version: 1,
    },
  ),
);
