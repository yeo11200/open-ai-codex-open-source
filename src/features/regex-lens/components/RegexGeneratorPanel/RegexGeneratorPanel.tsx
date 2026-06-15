import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/common/Badge';
import { BoltIcon } from '@/components/common/icons';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { TextArea } from '@/components/common/TextArea';
import { ROUTES } from '@/constants/routes';

import { useProviderPicker } from '../../hooks/useProviderPicker';
import type { GeneratedRegex } from '../../hooks/useRegexGenerator';
import { useRegexGenerator } from '../../hooks/useRegexGenerator';
import { runRegex } from '../../utils/regex-matcher';
import { ProviderModelSelect } from '../ProviderModelSelect';
import styles from './RegexGeneratorPanel.module.scss';

interface RegexGeneratorPanelProps {
  /** 생성된 정규식을 상위(View)의 패턴 입력란에 반영한다. */
  onGenerated: (pattern: string, flags: string) => void;
}

interface ValidationRow {
  example: string;
  /** 기대 동작: 매칭되어야 하면 true */
  expectMatch: boolean;
  matched: boolean;
  passed: boolean;
}

const toLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * AI 정규식 생성 + 예시 검증 패널.
 * 자연어 설명과 "포함/제외" 예시를 받아 AI가 정규식을 만들고, 그 예시들로 즉시 검증한다.
 */
export const RegexGeneratorPanel = ({ onGenerated }: RegexGeneratorPanelProps) => {
  const picker = useProviderPicker();
  const { status, error, generate, stop } = useRegexGenerator();

  const [description, setDescription] = useState('');
  const [mustMatchText, setMustMatchText] = useState('');
  const [mustNotMatchText, setMustNotMatchText] = useState('');
  const [generated, setGenerated] = useState<GeneratedRegex | null>(null);

  const mustMatch = useMemo(() => toLines(mustMatchText), [mustMatchText]);
  const mustNotMatch = useMemo(() => toLines(mustNotMatchText), [mustNotMatchText]);

  const isStreaming = status === 'streaming';

  // 생성된 정규식을 예시들로 검증한다 (결정론적 매처 재사용).
  const validation = useMemo<ValidationRow[]>(() => {
    if (!generated) return [];
    const check = (example: string, expectMatch: boolean): ValidationRow => {
      const result = runRegex(generated.pattern, generated.flags, example);
      const matched = result.ok && result.matches.length > 0;
      return { example, expectMatch, matched, passed: matched === expectMatch };
    };
    return [
      ...mustMatch.map((example) => check(example, true)),
      ...mustNotMatch.map((example) => check(example, false)),
    ];
  }, [generated, mustMatch, mustNotMatch]);

  const passedCount = validation.filter((row) => row.passed).length;
  const allPassed = validation.length > 0 && passedCount === validation.length;

  const handleGenerate = async () => {
    if (!picker.target) return;
    const result = await generate({ description, mustMatch, mustNotMatch }, picker.target);
    if (result) {
      setGenerated(result);
      onGenerated(result.pattern, result.flags);
    }
  };

  if (picker.readyProviders.length === 0) {
    return (
      <div className={styles.locked}>
        <BoltIcon width={18} height={18} />
        <span>
          AI 생성을 쓰려면 <Link to={ROUTES.settings}>설정에서 API 키</Link>를 먼저 입력하세요.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <TextArea
        label="무엇을 매칭하고 싶나요?"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="예: 한국 휴대폰 번호 (010으로 시작, 하이픈 선택)"
        rows={2}
      />

      <div className={styles.examples}>
        <TextArea
          label="포함되어야 할 예시 (줄당 하나)"
          mono
          value={mustMatchText}
          onChange={(event) => setMustMatchText(event.target.value)}
          placeholder={'010-1234-5678\n01098765432'}
          rows={3}
        />
        <TextArea
          label="제외되어야 할 예시 (줄당 하나)"
          mono
          value={mustNotMatchText}
          onChange={(event) => setMustNotMatchText(event.target.value)}
          placeholder={'02-123-4567\n전화 없음'}
          rows={3}
        />
      </div>

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
            onClick={handleGenerate}
            disabled={!description.trim()}
          >
            AI로 정규식 생성
          </Button>
        )}
      </div>

      {isStreaming && <Spinner label="정규식을 생성하는 중…" />}
      {error && <p className={styles.error}>{error}</p>}

      {generated && !isStreaming && (
        <div className={styles.result}>
          <div className={styles.resultHead}>
            <code className={styles.generated}>
              /{generated.pattern}/{generated.flags}
            </code>
            {validation.length > 0 && (
              <Badge tone={allPassed ? 'success' : 'danger'} dot>
                검증 {passedCount}/{validation.length} 통과
              </Badge>
            )}
          </div>

          {generated.explanation && <p className={styles.explanation}>{generated.explanation}</p>}

          {validation.length > 0 && (
            <ul className={styles.validation}>
              {validation.map((row, index) => (
                <li key={`${row.example}-${index}`} className={styles.validationRow}>
                  <span className={styles.mark} data-pass={row.passed}>
                    {row.passed ? '✓' : '✗'}
                  </span>
                  <code className={styles.example}>{row.example}</code>
                  <span className={styles.expect}>
                    {row.expectMatch ? '포함 기대' : '제외 기대'}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className={styles.hint}>생성된 정규식이 위 입력란에 적용되었습니다.</p>
        </div>
      )}
    </div>
  );
};
