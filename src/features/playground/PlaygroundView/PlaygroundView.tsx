import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ShareIcon } from '@/components/common/icons';
import { TextArea } from '@/components/common/TextArea';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePlaygroundStore } from '@/store/playground/playgroundStore';
import { copyText } from '@/utils/clipboard';

import { CollectionPanel } from '../components/CollectionPanel';
import { ResultColumn } from '../components/ResultColumn';
import { TargetSelector } from '../components/TargetSelector';
import { targetKey, usePlaygroundRunner } from '../hooks/usePlaygroundRunner';
import { buildShareUrl, decodeDraft, SHARE_PARAM } from '../utils/share';
import styles from './PlaygroundView.module.scss';

export const PlaygroundView = () => {
  const draft = usePlaygroundStore((state) => state.draft);
  const setSystem = usePlaygroundStore((state) => state.setSystem);
  const setUser = usePlaygroundStore((state) => state.setUser);
  const setTemperature = usePlaygroundStore((state) => state.setTemperature);
  const replaceDraft = usePlaygroundStore((state) => state.replaceDraft);

  const { runs, isRunning, run, stop } = usePlaygroundRunner();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shared, setShared] = useState(false);

  // 공유 링크로 진입 시 draft를 복원하고 파라미터를 제거한다.
  useEffect(() => {
    const token = searchParams.get(SHARE_PARAM);
    if (!token) return;
    const decoded = decodeDraft(token);
    if (decoded) replaceDraft(decoded);
    searchParams.delete(SHARE_PARAM);
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, replaceDraft]);

  const canRun = draft.targets.length > 0 && draft.user.trim().length > 0;

  const handleShare = async () => {
    const ok = await copyText(buildShareUrl(draft));
    if (!ok) return;
    setShared(true);
    window.setTimeout(() => setShared(false), 1500);
  };

  return (
    <div className={styles.view}>
      <PageHeader
        title="Playground"
        description="하나의 프롬프트를 여러 모델에 동시에 보내 응답을 나란히 비교하세요. 결과는 스트리밍으로 도착합니다."
        actions={
          <Button variant="ghost" leading={<ShareIcon width={16} height={16} />} onClick={handleShare}>
            {shared ? '링크 복사됨' : '공유'}
          </Button>
        }
      />

      <div className={styles.body}>
        {/* ── 좌측: 편집 패널 ── */}
        <aside className={styles.editor}>
          <TextArea
            label="System (선택)"
            mono
            value={draft.system}
            onChange={(event) => setSystem(event.target.value)}
            placeholder="모델의 역할/규칙을 정의하세요."
            rows={3}
          />

          <TextArea
            label="User"
            value={draft.user}
            onChange={(event) => setUser(event.target.value)}
            placeholder="질문 또는 지시를 입력하세요."
            rows={6}
          />

          <div className={styles.tempRow}>
            <label className={styles.tempLabel} htmlFor="temperature">
              Temperature
            </label>
            <input
              id="temperature"
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={draft.temperature}
              onChange={(event) => setTemperature(Number(event.target.value))}
              className={styles.tempInput}
            />
            <span className={styles.tempValue}>{draft.temperature.toFixed(1)}</span>
          </div>

          <div className={styles.targetsBlock}>
            <span className={styles.blockLabel}>비교 대상</span>
            <TargetSelector />
          </div>

          <div className={styles.actions}>
            {isRunning ? (
              <Button variant="danger" onClick={stop} className={styles.runBtn}>
                중단
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => run(draft)}
                disabled={!canRun}
                className={styles.runBtn}
              >
                ▶ 실행 ({draft.targets.length})
              </Button>
            )}
          </div>

          <CollectionPanel />
        </aside>

        {/* ── 우측: 결과 비교 ── */}
        <section className={styles.results}>
          {draft.targets.length === 0 ? (
            <div className={styles.emptyState}>
              <p>비교할 모델을 한 개 이상 선택하세요.</p>
            </div>
          ) : (
            <div
              className={styles.grid}
              data-count={Math.min(draft.targets.length, 3)}
            >
              {draft.targets.map((target) => (
                <ResultColumn
                  key={targetKey(target)}
                  target={target}
                  state={runs[targetKey(target)]}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
