import { useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { CopyIcon } from '@/components/common/icons';
import { Spinner } from '@/components/common/Spinner';
import { getProvider } from '@/lib/providers';
import type { ProviderTarget } from '@/store/playground/playgroundStore';
import { copyText } from '@/utils/clipboard';

import type { TargetRunState } from '../../hooks/usePlaygroundRunner';
import styles from './ResultColumn.module.scss';

interface ResultColumnProps {
  target: ProviderTarget;
  state?: TargetRunState;
}

const STATUS_LABEL: Record<NonNullable<TargetRunState>['status'], string> = {
  idle: '대기',
  streaming: '생성 중',
  done: '완료',
  error: '오류',
};

const formatTokens = (state: TargetRunState): string | null => {
  const total =
    (state.usage?.promptTokens ?? 0) + (state.usage?.completionTokens ?? 0);
  return total > 0 ? `${total} tok` : null;
};

export const ResultColumn = ({ target, state }: ResultColumnProps) => {
  const provider = getProvider(target.providerId);
  const [copied, setCopied] = useState(false);

  const status = state?.status ?? 'idle';
  const text = state?.text ?? '';

  const handleCopy = async () => {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const tokens = state ? formatTokens(state) : null;

  return (
    <article className={styles.column} data-provider={target.providerId}>
      <header className={styles.head}>
        <div className={styles.identity}>
          <span className={styles.dot} />
          <div className={styles.names}>
            <span className={styles.provider}>{provider.label}</span>
            <span className={styles.model}>{target.model}</span>
          </div>
        </div>

        <div className={styles.meta}>
          {status === 'streaming' && <Spinner />}
          {status === 'done' && (
            <>
              {state?.elapsedMs != null && (
                <span className={styles.elapsed}>{(state.elapsedMs / 1000).toFixed(1)}s</span>
              )}
              {tokens && <Badge tone="neutral">{tokens}</Badge>}
            </>
          )}
          {status === 'error' && <Badge tone="danger">{STATUS_LABEL.error}</Badge>}
          {text && (
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopy}
              aria-label="결과 복사"
            >
              {copied ? '복사됨' : <CopyIcon width={15} height={15} />}
            </button>
          )}
        </div>
      </header>

      <div className={styles.body}>
        {status === 'error' ? (
          <p className={styles.error}>{state?.error}</p>
        ) : text ? (
          <pre className={styles.text}>{text}</pre>
        ) : status === 'streaming' ? (
          <Spinner label="응답을 기다리는 중…" />
        ) : (
          <p className={styles.placeholder}>실행하면 결과가 여기에 표시됩니다.</p>
        )}
      </div>
    </article>
  );
};
