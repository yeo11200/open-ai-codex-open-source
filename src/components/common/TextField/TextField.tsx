import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

import styles from './TextField.module.scss';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: ReactNode;
}

export const TextField = ({ label, hint, className, id, ...rest }: TextFieldProps) => {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <input id={fieldId} className={styles.input} {...rest} />
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
};
