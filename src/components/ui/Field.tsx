import React from 'react';
import { cn } from '../../lib/utils';

export interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  hint,
  error,
  prefix,
  suffix,
  id,
  className,
  disabled,
  children,
  ...rest
}) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hintId = hint || error ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      {label && (
        <label
          htmlFor={inputId}
          className="font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] tracking-[var(--text-footnote-tracking)] text-[var(--label-secondary)]"
        >
          {label}
        </label>
      )}

      {children ? (
        children
      ) : (
        <div
          className={cn(
            'flex items-center overflow-hidden',
            'h-[var(--control-height)] min-h-[var(--control-height)]',
            'rounded-[var(--radius-control)]',
            'bg-[var(--fill-tertiary)]',
            'shadow-[var(--hairline,0_0_0_0.5px_var(--separator))]',
            'focus-within:shadow-[0_0_0_2px_var(--tint-soft),0_0_0_0.5px_var(--tint)]',
            disabled && 'opacity-40',
            className
          )}
        >
          {prefix && (
            <span className="pl-[var(--space-3)] shrink-0 select-none font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] text-[var(--label-tertiary)]">
              {prefix}
            </span>
          )}
          <input
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={hintId}
            className={cn(
              'ui-field-input w-full min-w-0 bg-transparent outline-none border-0',
              'h-full px-[var(--space-3)]',
              'font-[family-name:var(--font-text)]',
              'text-[length:var(--text-body-size)] leading-[var(--text-body-line)] tracking-[var(--text-body-tracking)]',
              'text-[var(--label)] placeholder:text-[var(--label-tertiary)]'
            )}
            {...rest}
          />
          {suffix && (
            <span className="pr-[var(--space-3)] shrink-0 select-none font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] text-[var(--label-tertiary)]">
              {suffix}
            </span>
          )}
        </div>
      )}

      {(error || hint) && (
        <p
          id={hintId}
          className={cn(
            'font-[family-name:var(--font-text)] text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] tracking-[var(--text-caption-1-tracking)]',
            error ? 'text-[var(--system-red)]' : 'text-[var(--label-tertiary)]'
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
};
