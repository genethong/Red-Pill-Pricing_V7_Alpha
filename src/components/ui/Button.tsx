import React from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';
export type ButtonSize = 'regular' | 'compact';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  filled:
    'bg-[var(--tint)] text-[var(--on-tint)] hover:bg-[var(--tint-hover)] active:bg-[var(--tint-press)]',
  tinted:
    'bg-[var(--tint-soft)] text-[var(--tint)] hover:opacity-90 active:opacity-80',
  gray:
    'bg-[var(--fill-tertiary)] text-[var(--label)] hover:bg-[var(--fill-secondary)] active:bg-[var(--fill)]',
  plain:
    'bg-transparent text-[var(--tint)] hover:bg-[var(--fill-quaternary)] active:bg-[var(--fill-tertiary)]',
  destructive:
    'bg-[var(--system-red)] text-[var(--on-tint)] hover:opacity-90 active:opacity-80',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'filled',
  size = 'regular',
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 select-none',
        'font-[family-name:var(--font-text)] font-semibold',
        'rounded-[var(--radius-control)]',
        'transition-[background-color,opacity,color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tint)]',
        'disabled:opacity-40 disabled:pointer-events-none',
        size === 'regular' &&
          'h-[var(--control-height)] min-h-[var(--control-height)] px-[var(--space-4)] text-[length:var(--text-headline-size)] leading-[var(--text-headline-line)] tracking-[var(--text-headline-tracking)]',
        size === 'compact' &&
          'h-8 px-[var(--space-3)] text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] tracking-[var(--text-subhead-tracking)]',
        variantClass[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
