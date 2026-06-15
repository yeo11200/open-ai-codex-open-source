import type { LlmProvider, ProviderId } from '@/lib/providers';

import styles from './ProviderModelSelect.module.scss';

interface ProviderModelSelectProps {
  readyProviders: LlmProvider[];
  activeProvider?: LlmProvider;
  activeProviderId: ProviderId | '';
  activeModel: string;
  onProviderChange: (id: ProviderId) => void;
  onModelChange: (model: string) => void;
}

/** 프로바이더 + 모델을 고르는 공용 셀렉트 쌍. */
export const ProviderModelSelect = ({
  readyProviders,
  activeProvider,
  activeProviderId,
  activeModel,
  onProviderChange,
  onModelChange,
}: ProviderModelSelectProps) => (
  <>
    <select
      className={styles.select}
      value={activeProviderId}
      onChange={(event) => onProviderChange(event.target.value as ProviderId)}
    >
      {readyProviders.map((provider) => (
        <option key={provider.id} value={provider.id}>
          {provider.label}
        </option>
      ))}
    </select>

    <select
      className={styles.select}
      value={activeModel}
      onChange={(event) => onModelChange(event.target.value)}
    >
      {activeProvider?.defaultModels.map((model) => (
        <option key={model} value={model}>
          {model}
        </option>
      ))}
    </select>
  </>
);
