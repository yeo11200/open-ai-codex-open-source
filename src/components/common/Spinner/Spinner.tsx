import styles from './Spinner.module.scss';

export interface SpinnerProps {
  /** 스트리밍 중 표시되는 점 3개 애니메이션 */
  label?: string;
}

export const Spinner = ({ label }: SpinnerProps) => (
  <span className={styles.wrap} role="status" aria-label={label ?? '로딩 중'}>
    <span className={styles.dots}>
      <i />
      <i />
      <i />
    </span>
    {label && <span className={styles.label}>{label}</span>}
  </span>
);
