import type { ReactNode } from 'react';

import styles from './PageHeader.module.scss';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** 우측 액션 영역 (버튼 등) */
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <header className={styles.header}>
    <div className={styles.texts}>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </div>
    {actions && <div className={styles.actions}>{actions}</div>}
  </header>
);
