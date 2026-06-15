import { useMemo, useState } from 'react';

import type { ProviderId } from '@/lib/providers';
import { PROVIDER_LIST } from '@/lib/providers';
import type { ProviderTarget } from '@/store/playground/playgroundStore';
import { useSettingsStore } from '@/store/settings/settingsStore';

/**
 * 사용 준비된(키/베이스URL 보유) 프로바이더 중 하나와 모델을 고르는 공용 훅.
 * AI 설명 패널과 AI 생성 패널이 동일한 선택 UX를 공유하기 위해 추출했다.
 */
export const useProviderPicker = () => {
  const credentials = useSettingsStore((state) => state.credentials);

  const readyProviders = useMemo(
    () =>
      PROVIDER_LIST.filter((provider) => {
        const cred = credentials[provider.id];
        return provider.requiresApiKey
          ? Boolean(cred.apiKey?.trim())
          : Boolean(cred.baseUrl?.trim());
      }),
    [credentials],
  );

  const [providerId, setProviderId] = useState<ProviderId | ''>('');
  const [model, setModel] = useState('');

  // 미선택 시 첫 번째 준비된 프로바이더/모델을 기본값으로 사용한다.
  const activeProviderId = (providerId || readyProviders[0]?.id || '') as ProviderId | '';
  const activeProvider = PROVIDER_LIST.find((provider) => provider.id === activeProviderId);
  const activeModel = model || activeProvider?.defaultModels[0] || '';

  const target: ProviderTarget | null =
    activeProviderId && activeModel
      ? { providerId: activeProviderId, model: activeModel }
      : null;

  const handleProviderChange = (next: ProviderId) => {
    setProviderId(next);
    setModel('');
  };

  return {
    readyProviders,
    activeProvider,
    activeProviderId,
    activeModel,
    target,
    handleProviderChange,
    setModel,
  };
};
