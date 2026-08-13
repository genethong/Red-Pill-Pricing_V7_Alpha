import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string | null | undefined;
  onChange: (e: { target: { value: string } }) => void;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "",
  disabled = false,
  prefix,
  suffix,
  id,
  ...rest
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);

  // Formats raw numeric string to a thousands-separated version
  const formatString = (valStr: string): string => {
    if (!valStr && valStr !== '0') return '';
    
    // Clean string: keep only sign, digits, and first decimal point
    let clean = valStr.replace(/[^\d.-]/g, '');
    
    // Ensure only one minus sign at start
    const isNegative = clean.startsWith('-');
    clean = clean.replace(/-/g, '');
    if (isNegative) clean = '-' + clean;
    
    // Ensure only one decimal point
    const parts = clean.split('.');
    let integerPart = parts[0];
    let decimalPart = parts.slice(1).join('');
    
    // Add commas to pure integer part
    if (integerPart && integerPart !== '-') {
      const sign = integerPart.startsWith('-') ? '-' : '';
      const absInt = integerPart.replace('-', '');
      const parsedInt = parseFloat(absInt);
      if (!isNaN(parsedInt)) {
        integerPart = sign + parsedInt.toLocaleString('en-US', { maximumFractionDigits: 0 });
      }
    }
    
    if (valStr.includes('.') && parts.length > 1) {
      return `${integerPart}.${decimalPart}`;
    } else if (valStr.endsWith('.')) {
      return `${integerPart}.`;
    }
    return integerPart;
  };

  // Sync display state when parent value changes
  useEffect(() => {
    if (!isFocused.current) {
      if (value === null || value === undefined || value === '') {
        setDisplayValue('');
      } else {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(num)) {
          setDisplayValue(num.toLocaleString('en-US', { maximumFractionDigits: 10 }));
        } else {
          setDisplayValue('');
        }
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    
    // 1. Keep track of cursor position relative to numeric characters (digits, minus, dot)
    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = rawInput.substring(0, selectionStart);
    const numericCharsBeforeCursor = textBeforeCursor.replace(/[^\d.-]/g, '').length;

    // 2. Format the string for display
    const formatted = formatString(rawInput);
    setDisplayValue(formatted);

    // 3. Extract the clean number string and pass to parent onChange
    const numericStr = formatted.replace(/,/g, '');
    
    onChange({
      target: {
        value: numericStr
      }
    });

    // 4. Restore cursor position
    setTimeout(() => {
      const inputEl = inputRef.current;
      if (inputEl) {
        let newCursorPos = 0;
        let countedNumericChars = 0;
        const currentText = inputEl.value;
        
        for (let i = 0; i < currentText.length; i++) {
          const char = currentText[i];
          if (/[\d.-]/.test(char)) {
            countedNumericChars++;
          }
          if (countedNumericChars > numericCharsBeforeCursor) {
            newCursorPos = i;
            break;
          }
          newCursorPos = i + 1;
        }
        inputEl.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = false;
    if (value === null || value === undefined || value === '') {
      setDisplayValue('');
    } else {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(num)) {
        setDisplayValue(num.toLocaleString('en-US', { maximumFractionDigits: 10 }));
      } else {
        setDisplayValue('');
      }
    }
    if (rest.onBlur) {
      rest.onBlur(e);
    }
  };

  const layoutClass = className
    .split(/\s+/)
    .filter((c) => /^(w-|min-w-|max-w-|flex-)/.test(c))
    .join(' ');
  const textAlignmentClass = className.match(/\b(text-right|text-left|text-center)\b/)?.[0] || 'text-right';

  return (
    <div
      className={cn(
        'relative flex items-center overflow-hidden',
        'h-[var(--control-height)] min-h-[var(--control-height)]',
        'rounded-[var(--radius-control)] bg-[var(--fill-tertiary)]',
        'shadow-[0_0_0_0.5px_var(--separator)]',
        'focus-within:shadow-[0_0_0_2px_var(--tint-soft),0_0_0_0.5px_var(--tint)]',
        disabled && 'opacity-40',
        layoutClass
      )}
    >
      {prefix && (
        <span className="pl-[var(--space-3)] shrink-0 select-none font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] text-[var(--label-tertiary)]">
          {prefix}
        </span>
      )}
      <input
        {...rest}
        ref={inputRef}
        type="text"
        id={id}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        onFocus={(e) => {
          isFocused.current = true;
          if (rest.onFocus) rest.onFocus(e);
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          'ui-numeric-input w-full h-full bg-transparent outline-none border-0 focus:ring-0',
          'px-[var(--space-3)] py-0',
          'font-[family-name:var(--font-numeric)]',
          'text-[length:var(--text-body-size)] leading-[var(--text-body-line)] tracking-[var(--text-body-tracking)]',
          'text-[var(--label)] placeholder:text-[var(--label-tertiary)]',
          textAlignmentClass
        )}
      />
      {suffix && (
        <span className="pr-[var(--space-3)] shrink-0 select-none font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] text-[var(--label-tertiary)]">
          {suffix}
        </span>
      )}
    </div>
  );
};
