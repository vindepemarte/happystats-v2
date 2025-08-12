// Reusable Button component with mobile-first design

import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Mobile-first touch targets (minimum 44px height for accessibility)
      'min-h-[44px] touch-manipulation',
    ];

    const variantClasses = {
      primary: [
        'bg-primary text-primary-foreground',
        'hover:opacity-90 active:opacity-80',
        'focus:ring-primary/50',
        'shadow-sm hover:shadow-md',
      ],
      secondary: [
        'bg-secondary text-secondary-foreground',
        'hover:opacity-90 active:opacity-80',
        'focus:ring-secondary/50',
        'shadow-sm hover:shadow-md',
      ],
      destructive: [
        'bg-destructive text-destructive-foreground',
        'hover:opacity-90 active:opacity-80',
        'focus:ring-destructive/50',
        'shadow-sm hover:shadow-md',
      ],
      outline: [
        'border border-border bg-background text-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:ring-ring/50',
      ],
      ghost: [
        'text-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:ring-ring/50',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm gap-2',
      md: 'px-4 py-3 text-base gap-2',
      lg: 'px-6 py-4 text-lg gap-3',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };