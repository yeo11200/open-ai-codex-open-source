import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { BoltIcon } from '@/components/common/icons';
import { ROUTES } from '@/constants/routes';
import type { ProviderId } from '@/lib/providers';
import { PROVIDER_LIST } from '@/lib/providers';
import { useSettingsStore } from '@/store/settings/settingsStore';

import { useRegexExplainer } from '../../hooks/useRegexExplainer';
import styles from './AiExplanationPanel.module.scss';

interface AiExplanationPanelProps {
  pattern: string;
  flags: string;
}

/**
 * 정규식 AI 설명 패널.
 * 사용 준비된 프로바이더만 선택지로 노출하고, 결정론적 분해를 보완하는 평어 설명을 스트리밍한다.
 */
export const AiExplanationPanel = ({ pattern, flags }: AiExplanationPanelProps) => {
  const credentials = useSettingsStore((state) => state.credentials);
  const { text, status, error, explain, stop } = useRegexExplainer();

  const readyProviders = useMemo(
    () =>
      PROVIDER_LIST.filter((provider) => {
        const cred = credentials[provider.id];
        return provider.requiresApiKey ? Boolean(cred.apiKey?.trim()) : Boolean(cred.baseUrl?.trim());
      }),
    [credentials],
  );

  const [providerId, setProviderId] = useState<ProviderId | ''>('');
  const [model, setModel] = useState('');

  // 선택된 프로바이더가 없으면 첫 번째 준비된 프로바이더를 기본값으로.
  const activeProviderId = (providerId || readyProviders[0]?.id || '') as ProviderId | '';
  const activeProvider = PROVIDER_LIST.find((p) => p.id === activeProviderId);
  const activeModel = model || activeProvider?.defaultModels[0] || '';

  const isStreaming = status === 'streaming';

  const handleExplain = () => {
    if (!activeProviderId || !activeModel) return;
    void explain(pattern, flags, { providerId: activeProviderId, model: activeModel });
  };

  if (readyProviders.length === 0) {
    return (
      <div className={styles.locked}>
        <BoltIcon width={18} height={18} />
        <span>
          AI 설명을 쓰려면 <Link to={ROUTES.settings}>설정에서 API 키</Link>를 먼저 입력하세요.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.controls}>
        <select
          className={styles.select}
          value={activeProviderId}
          onChange={(event) => {
            setProviderId(event.target.value as ProviderId);
            setModel('');
          }}
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
          onChange={(event) => setModel(event.target.value)}
        >
          {activeProvider?.defaultModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {isStreaming ? (
          <Button variant="danger" size="sm" onClick={stop}>
            중단
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            leading={<BoltIcon width={15} height={15} />}
            onClick={handleExplain}
            disabled={!pattern.trim()}
          >
            AI 설명 생성
          </Button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {text ? (
        <div className={styles.output}>{text}</div>
      ) : (
        !isStreaming && <p className={styles.hint}>버튼을 누르면 AI가 이 정규식을 설명합니다.</p>
      )}
    </div>
  );
};
