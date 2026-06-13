import { Badge } from '@/components/common/Badge';
import { TextField } from '@/components/common/TextField';
import type { LlmProvider } from '@/lib/providers';
import { useSettingsStore } from '@/store/settings/settingsStore';

import styles from './ProviderCard.module.scss';

interface ProviderCardProps {
  provider: LlmProvider;
}

/** 키 발급 페이지 안내 링크 (프로바이더별) */
const KEY_GUIDE_URL: Partial<Record<LlmProvider['id'], string>> = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
};

export const ProviderCard = ({ provider }: ProviderCardProps) => {
  const credentials = useSettingsStore((state) => state.credentials[provider.id]);
  const setApiKey = useSettingsStore((state) => state.setApiKey);
  const setBaseUrl = useSettingsStore((state) => state.setBaseUrl);

  const isReady = provider.requiresApiKey
    ? Boolean(credentials.apiKey?.trim())
    : Boolean(credentials.baseUrl?.trim());

  const guideUrl = KEY_GUIDE_URL[provider.id];

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{provider.label}</h2>
          <Badge tone={isReady ? 'success' : 'neutral'} dot>
            {isReady ? '연결됨' : '미설정'}
          </Badge>
        </div>
        <p className={styles.models}>
          모델 예시: <code>{provider.defaultModels.join(', ')}</code>
        </p>
      </header>

      <div className={styles.fields}>
        {provider.requiresApiKey && (
          <TextField
            label="API Key"
            type="password"
            autoComplete="off"
            placeholder="sk-..."
            value={credentials.apiKey ?? ''}
            onChange={(event) => setApiKey(provider.id, event.target.value)}
            hint={
              guideUrl ? (
                <a href={guideUrl} target="_blank" rel="noreferrer" className={styles.link}>
                  키 발급받기 →
                </a>
              ) : undefined
            }
          />
        )}

        {provider.configurableBaseUrl && (
          <TextField
            label="Base URL"
            type="url"
            placeholder="http://localhost:11434"
            value={credentials.baseUrl ?? ''}
            onChange={(event) => setBaseUrl(provider.id, event.target.value)}
            hint="로컬 Ollama 서버 주소. 브라우저 호출 허용을 위해 OLLAMA_ORIGINS 설정이 필요할 수 있습니다."
          />
        )}
      </div>
    </section>
  );
};
