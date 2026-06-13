import { PageHeader } from '@/components/layout/PageHeader';
import { PROVIDER_LIST } from '@/lib/providers';

import { ProviderCard } from '../components/ProviderCard';
import styles from './SettingsView.module.scss';

/**
 * BYOK 설정 화면.
 * 모든 키는 브라우저 localStorage에만 저장되며 서버로 전송되지 않는다는 점을 명시한다.
 */
export const SettingsView = () => (
  <div className={styles.view}>
    <PageHeader
      title="설정"
      description="Lumen은 백엔드가 없는 로컬 우선 도구입니다. API 키는 당신의 브라우저에만 저장되고, 요청은 브라우저에서 각 프로바이더로 직접 전송됩니다."
    />

    <div className={styles.body}>
      <div className={styles.notice}>
        <strong>🔒 키는 어디로도 전송되지 않습니다.</strong>
        <span>
          입력한 키는 <code>localStorage</code>에만 보관됩니다. 공용 PC에서는 사용 후 브라우저
          저장소를 비워주세요.
        </span>
      </div>

      <div className={styles.grid}>
        {PROVIDER_LIST.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  </div>
);
