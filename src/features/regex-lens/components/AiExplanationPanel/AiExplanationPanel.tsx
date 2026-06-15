import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { BoltIcon } from '@/components/common/icons';
import { ROUTES } from '@/constants/routes';

import { useProviderPicker } from '../../hooks/useProviderPicker';
import { useRegexExplainer } from '../../hooks/useRegexExplainer';
import { ProviderModelSelect } from '../ProviderModelSelect';
import styles from './AiExplanationPanel.module.scss';

interface AiExplanationPanelProps {
  pattern: string;
  flags: string;
}

/**
 * 정규식 AI 설명 패널.
 * 결정론적 분해를 보완하는 평어 설명을 스트리밍한다.
 */
export const AiExplanationPanel = ({ pattern, flags }: AiExplanationPanelProps) => {
  const picker = useProviderPicker();
  const { text, status, error, explain, stop } = useRegexExplainer();

  const isStreaming = status === 'streaming';

  const handleExplain = () => {
    if (!picker.target) return;
    void explain(pattern, flags, picker.target);
  };

  if (picker.readyProviders.length === 0) {
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
        <ProviderModelSelect
          readyProviders={picker.readyProviders}
          activeProvider={picker.activeProvider}
          activeProviderId={picker.activeProviderId}
          activeModel={picker.activeModel}
          onProviderChange={picker.handleProviderChange}
          onModelChange={picker.setModel}
        />

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
