import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { TrashIcon } from '@/components/common/icons';
import { usePlaygroundStore } from '@/store/playground/playgroundStore';

import styles from './CollectionPanel.module.scss';

const formatDate = (timestamp: number): string =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);

/**
 * 저장된 프롬프트 컬렉션 패널.
 * 현재 draft를 이름과 함께 저장하고, 항목을 클릭해 다시 불러온다.
 */
export const CollectionPanel = () => {
  const saved = usePlaygroundStore((state) => state.saved);
  const savePrompt = usePlaygroundStore((state) => state.savePrompt);
  const loadPrompt = usePlaygroundStore((state) => state.loadPrompt);
  const deletePrompt = usePlaygroundStore((state) => state.deletePrompt);

  const [title, setTitle] = useState('');

  const handleSave = () => {
    savePrompt(title);
    setTitle('');
  };

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>컬렉션</h3>
        <span className={styles.count}>{saved.length}</span>
      </header>

      <div className={styles.saveRow}>
        <input
          className={styles.input}
          placeholder="현재 프롬프트 이름…"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSave();
          }}
        />
        <Button size="sm" variant="secondary" onClick={handleSave}>
          저장
        </Button>
      </div>

      {saved.length === 0 ? (
        <p className={styles.empty}>저장된 프롬프트가 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {saved.map((prompt) => (
            <li key={prompt.id} className={styles.item}>
              <button
                type="button"
                className={styles.itemMain}
                onClick={() => loadPrompt(prompt.id)}
              >
                <span className={styles.itemTitle}>{prompt.title}</span>
                <span className={styles.itemMeta}>
                  타깃 {prompt.targets.length} · {formatDate(prompt.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => deletePrompt(prompt.id)}
                aria-label="삭제"
              >
                <TrashIcon width={15} height={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
