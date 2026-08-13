import React from 'react';
import { cn } from '../../lib/utils';

export interface GroupedSectionProps {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const GroupedSection: React.FC<GroupedSectionProps> = ({
  title,
  footer,
  children,
  className,
}) => {
  return (
    <section className={cn('flex flex-col gap-[var(--space-2)]', className)}>
      {title && (
        <h3 className="px-[var(--space-4)] font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] tracking-[var(--text-footnote-tracking)] font-normal text-[var(--label-secondary)]">
          {title}
        </h3>
      )}
      <div className="rounded-[var(--radius-element)] bg-[var(--bg-elevated)] shadow-[0_0_0_0.5px_var(--separator)] overflow-hidden">
        {children}
      </div>
      {footer && (
        <div className="px-[var(--space-4)] font-[family-name:var(--font-text)] text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line)] tracking-[var(--text-caption-1-tracking)] text-[var(--label-tertiary)]">
          {footer}
        </div>
      )}
    </section>
  );
};

export interface GroupedRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GroupedRow: React.FC<GroupedRowProps> = ({ children, className, onClick }) => {
  const interactive = typeof onClick === 'function';

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'flex items-center min-h-[var(--row-height)] px-[var(--space-4)] py-[var(--space-2)]',
        'font-[family-name:var(--font-text)] text-[length:var(--text-body-size)] leading-[var(--text-body-line)] tracking-[var(--text-body-tracking)] text-[var(--label)]',
        'shadow-[inset_0_-0.5px_0_var(--separator)] last:shadow-none',
        interactive && 'cursor-pointer hover:bg-[var(--fill-quaternary)] active:bg-[var(--fill-tertiary)]',
        className
      )}
    >
      {children}
    </div>
  );
};
