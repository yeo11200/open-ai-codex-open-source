import type { RegexToken } from '../../utils/regex-tokenizer';
import styles from './TokenBreakdown.module.scss';

interface TokenBreakdownProps {
  tokens: RegexToken[];
}

/**
 * 정규식 토큰을 ① 색상 입힌 패턴 스트립과 ② 설명 리스트로 시각화한다.
 * 타입별 색상은 CSS의 data-type 속성으로 매핑된다.
 */
export const TokenBreakdown = ({ tokens }: TokenBreakdownProps) => {
  if (tokens.length === 0) {
    return <p className={styles.empty}>패턴을 입력하면 구조가 분해됩니다.</p>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.strip}>
        {tokens.map((token, index) => (
          <span
            key={`${token.raw}-${index}`}
            className={styles.stripToken}
            data-type={token.type}
            title={token.description}
          >
            {token.raw}
          </span>
        ))}
      </div>

      <ul className={styles.list}>
        {tokens.map((token, index) => (
          <li key={`${token.raw}-${index}-row`} className={styles.row}>
            <code className={styles.rawCode} data-type={token.type}>
              {token.raw}
            </code>
            <div className={styles.rowText}>
              <span className={styles.rowLabel}>{token.label}</span>
              <span className={styles.rowDesc}>{token.description}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
