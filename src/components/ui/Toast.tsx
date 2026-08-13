import React from 'react';
import { cn } from '../../lib/utils';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  tone?: ToastTone;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, tone = 'info', onDismiss }) => {
  React.useEffect(() => {
    const id = window.setTimeout(onDismiss, 2800);
    return () => window.clearTimeout(id);
  }, [message, tone, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto max-w-[min(420px,calc(100vw-2rem))] px-[var(--space-4)] py-[var(--space-3)]',
        'rounded-[var(--radius-sheet)]',
        'bg-[var(--material-thick-fill)] backdrop-blur-[var(--material-blur-thick)] backdrop-saturate-[var(--material-saturate)]',
        'shadow-[var(--glass-highlight),var(--shadow-menu)]',
        'font-[family-name:var(--font-text)] text-[length:var(--text-subhead-size)] leading-[var(--text-subhead-line)] font-medium',
        tone === 'error' && 'text-[var(--system-red)]',
        tone === 'success' && 'text-[var(--label)]',
        tone === 'info' && 'text-[var(--label)]'
      )}
    >
      {message}
    </div>
  );
};
