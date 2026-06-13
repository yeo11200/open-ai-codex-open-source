import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';

import { AiExplanationPanel } from '../components/AiExplanationPanel';
import { MatchPreview } from '../components/MatchPreview';
import { TokenBreakdown } from '../components/TokenBreakdown';
import { REGEX_PRESETS } from '../constants';
import { buildSegments, runRegex } from '../utils/regex-matcher';
import { tokenizeRegex } from '../utils/regex-tokenizer';
import styles from './RegexLensView.module.scss';

const INITIAL = REGEX_PRESETS[0];

/**
 * Regex Lens 화면.
 * 결정론적 분해(토큰·매치)와 AI 평어 설명을 한 화면에서 결합한다.
 */
export const RegexLensView = () => {
  const [pattern, setPattern] = useState(INITIAL.pattern);
  const [flags, setFlags] = useState(INITIAL.flags);
  const [sample, setSample] = useState(INITIAL.sample);

  const tokens = useMemo(() => tokenizeRegex(pattern), [pattern]);
  const result = useMemo(() => runRegex(pattern, flags, sample), [pattern, flags, sample]);
  const segments = useMemo(
    () => (result.ok ? buildSegments(sample, result.matches) : [{ text: sample, isMatch: false }]),
    [result, sample],
  );

  const applyPreset = (preset: (typeof REGEX_PRESETS)[number]) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setSample(preset.sample);
  };

  return (
    <div className={styles.view}>
      <PageHeader
        title="Regex Lens"
        description="정규식을 색상으로 분해하고, 실시간 매치를 확인하고, AI 설명까지 한 화면에서. 정규식을 이해하는 가장 빠른 방법."
      />

      <div className={styles.body}>
        <div className={styles.presets}>
          {REGEX_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={styles.preset}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className={styles.regexBox} data-invalid={!result.ok}>
          <span className={styles.slash}>/</span>
          <input
            className={styles.patternInput}
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="정규식 패턴"
            spellCheck={false}
            autoCapitalize="off"
          />
          <span className={styles.slash}>/</span>
          <input
            className={styles.flagsInput}
            value={flags}
            onChange={(event) => setFlags(event.target.value.replace(/[^gimsuy]/g, ''))}
            placeholder="flags"
            spellCheck={false}
          />
        </div>
        {!result.ok && <p className={styles.invalid}>⚠ {result.error}</p>}

        <div className={styles.columns}>
          <section className={styles.panelCard}>
            <h2 className={styles.cardTitle}>매치 테스트</h2>
            <MatchPreview
              value={sample}
              onChange={setSample}
              segments={segments}
              matchCount={result.ok ? result.matches.length : 0}
            />
          </section>

          <section className={styles.panelCard}>
            <h2 className={styles.cardTitle}>구조 분해</h2>
            <TokenBreakdown tokens={tokens} />
          </section>
        </div>

        <section className={styles.panelCard}>
          <h2 className={styles.cardTitle}>AI 설명</h2>
          <AiExplanationPanel pattern={pattern} flags={flags} />
        </section>
      </div>
    </div>
  );
};
