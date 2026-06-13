import { Badge } from '@/components/common/Badge';
import { TextArea } from '@/components/common/TextArea';

import type { HighlightSegment } from '../../utils/regex-matcher';
import styles from './MatchPreview.module.scss';

interface MatchPreviewProps {
  value: string;
  onChange: (value: string) => void;
  segments: HighlightSegment[];
  matchCount: number;
}

/**
 * 테스트 문자열 입력 + 매치 하이라이트 프리뷰.
 * 입력 textarea와 동일 텍스트를 색칠된 read-only 영역에 미러링한다.
 */
export const MatchPreview = ({ value, onChange, segments, matchCount }: MatchPreviewProps) => (
  <div className={styles.wrap}>
    <TextArea
      label="테스트 문자열"
      mono
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="여기에 매칭을 시험할 텍스트를 입력하세요."
      rows={4}
    />

    <div className={styles.previewHead}>
      <span className={styles.previewLabel}>하이라이트</span>
      <Badge tone={matchCount > 0 ? 'success' : 'neutral'}>
        {matchCount}개 매치
      </Badge>
    </div>

    <div className={styles.preview}>
      {value ? (
        segments.map((segment, index) =>
          segment.isMatch ? (
            <mark
              key={index}
              className={styles.hit}
              data-odd={(segment.matchIndex ?? 0) % 2 === 1}
            >
              {segment.text}
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )
      ) : (
        <span className={styles.placeholder}>텍스트를 입력하면 매치가 표시됩니다.</span>
      )}
    </div>
  </div>
);
