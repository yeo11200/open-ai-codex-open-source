import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ProviderCredentials, ProviderId } from '@/lib/providers';
import { OLLAMA_DEFAULT_BASE_URL, PROVIDER_IDS } from '@/lib/providers';

type CredentialMap = Record<ProviderId, ProviderCredentials>;

interface SettingsState {
  credentials: CredentialMap;
  setApiKey: (id: ProviderId, apiKey: string) => void;
  setBaseUrl: (id: ProviderId, baseUrl: string) => void;
  getCredentials: (id: ProviderId) => ProviderCredentials;
}

const buildInitialCredentials = (): CredentialMap => {
  const map = {} as CredentialMap;
  for (const id of PROVIDER_IDS) {
    map[id] = { apiKey: '', baseUrl: id === 'ollama' ? OLLAMA_DEFAULT_BASE_URL : '' };
  }
  return map;
};

/**
 * BYOK 인증 정보 스토어.
 * 로컬 우선 설계이므로 키는 사용자 브라우저 localStorage에만 저장된다 (서버 전송 없음).
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      credentials: buildInitialCredentials(),

      setApiKey: (id, apiKey) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            [id]: { ...state.credentials[id], apiKey },
          },
        })),

      setBaseUrl: (id, baseUrl) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            [id]: { ...state.credentials[id], baseUrl },
          },
        })),

      getCredentials: (id) => get().credentials[id],
    }),
    {
      name: 'lumen.settings',
      version: 1,
    },
  ),
);

/** 해당 프로바이더가 사용 준비됐는지 (키 필요 시 키 존재 여부) 파생 헬퍼 */
export const selectIsProviderReady =
  (id: ProviderId, requiresApiKey: boolean) =>
  (state: SettingsState): boolean => {
    if (!requiresApiKey) return true;
    return Boolean(state.credentials[id]?.apiKey?.trim());
  };
