import { useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { PROVIDER_LIST } from '@/lib/providers';
import { usePlaygroundStore } from '@/store/playground/playgroundStore';
import { useSettingsStore } from '@/store/settings/settingsStore';

import styles from './TargetSelector.module.scss';

/** 프로바이더가 사용 준비됐는지 (키/베이스URL 존재) 판단 */
const useProviderReady = () => {
  const credentials = useSettingsStore((state) => state.credentials);
  return (providerId: keyof typeof credentials, requiresApiKey: boolean): boolean => {
    const cred = credentials[providerId];
    if (requiresApiKey) return Boolean(cred.apiKey?.trim());
    return Boolean(cred.baseUrl?.trim());
  };
};

/**
 * 실행 대상(프로바이더 + 모델) 선택기.
 * 모델 칩을 토글해 비교 대상을 구성하고, 커스텀 모델도 추가할 수 있다.
 */
export const TargetSelector = () => {
  const targets = usePlaygroundStore((state) => state.draft.targets);
  const toggleTarget = usePlaygroundStore((state) => state.toggleTarget);
  const isProviderReady = useProviderReady();

  const [customModel, setCustomModel] = useState<Record<string, string>>({});

  const isSelected = (providerId: string, model: string): boolean =>
    targets.some((t) => t.providerId === providerId && t.model === model);

  const handleAddCustom = (providerId: (typeof PROVIDER_LIST)[number]['id']) => {
    const model = customModel[providerId]?.trim();
    if (!model) return;
    toggleTarget({ providerId, model });
    setCustomModel((prev) => ({ ...prev, [providerId]: '' }));
  };

  return (
    <div className={styles.selector}>
      {PROVIDER_LIST.map((provider) => {
        const ready = isProviderReady(provider.id, provider.requiresApiKey);
        return (
          <div key={provider.id} className={styles.group}>
            <div className={styles.groupHead}>
              <span className={styles.providerName}>{provider.label}</span>
              {!ready && (
                <Badge tone="neutral">키 필요</Badge>
              )}
            </div>

            <div className={styles.chips}>
              {provider.defaultModels.map((model) => (
                <button
                  key={model}
                  type="button"
                  className={[
                    styles.chip,
                    isSelected(provider.id, model) && styles.chipActive,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => toggleTarget({ providerId: provider.id, model })}
                >
                  {model}
                </button>
              ))}

              <span className={styles.custom}>
                <input
                  className={styles.customInput}
                  placeholder="커스텀 모델"
                  value={customModel[provider.id] ?? ''}
                  onChange={(event) =>
                    setCustomModel((prev) => ({ ...prev, [provider.id]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleAddCustom(provider.id);
                  }}
                />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
