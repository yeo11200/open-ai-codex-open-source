import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 좌측 아이콘 슬롯 */
  leading?: ReactNode;
}

export const Button = ({
  variant = 'secondary',
  size = 'md',
  leading,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) => {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {leading && <span className={styles.leading}>{leading}</span>}
      {children}
    </button>
  );
};
