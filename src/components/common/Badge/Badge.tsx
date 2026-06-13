import type { ReactNode } from 'react';

import styles from './Badge.module.scss';

type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger' | 'violet';

export interface BadgeProps {
  tone?: BadgeTone;
  /** 좌측 점(dot) 표시 여부 */
  dot?: boolean;
  children: ReactNode;
}

export const Badge = ({ tone = 'neutral', dot = false, children }: BadgeProps) => (
  <span className={[styles.badge, styles[tone]].join(' ')}>
    {dot && <span className={styles.dot} />}
    {children}
  </span>
);
