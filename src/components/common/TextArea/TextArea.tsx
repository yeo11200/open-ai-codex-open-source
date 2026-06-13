import type { TextareaHTMLAttributes } from 'react';
import { useId } from 'react';

import styles from './TextArea.module.scss';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** 코드/프롬프트 입력 시 monospace 적용 */
  mono?: boolean;
}

export const TextArea = ({ label, mono = false, className, id, ...rest }: TextAreaProps) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  const textareaClasses = [styles.textarea, mono && styles.mono].filter(Boolean).join(' ');

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <textarea id={fieldId} className={textareaClasses} {...rest} />
    </div>
  );
};
